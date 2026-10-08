using System.Text.Json;
using EKR.Infrastructure.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EKR.Application.Services;

public interface IFactoryOrderPublisher
{
    Task PublishWebsiteOrderAsync(Guid websiteOrderId, string customerName, string? notes, string snapshotJson, CancellationToken ct = default);
}

public class FactoryOrderPublisher : IFactoryOrderPublisher
{
    private readonly CatalogDbContext _catalog;
    private readonly ILogger<FactoryOrderPublisher> _logger;
    public FactoryOrderPublisher(CatalogDbContext catalog, ILogger<FactoryOrderPublisher> logger)
    {
        _catalog = catalog;
        _logger = logger;
    }

    public async Task PublishWebsiteOrderAsync(Guid websiteOrderId, string customerName, string? notes, string snapshotJson, CancellationToken ct = default)
    {
        if (await _catalog.Orders.AsNoTracking().AnyAsync(o => o.WebsiteOrderId == websiteOrderId, ct))
        {
            _logger.LogInformation("Factory order for website {OrderId} already exists", websiteOrderId);
            return;
        }

        var botUserId = await ResolveWebsiteBotUserIdAsync(ct);
        if (botUserId is null)
        {
            _logger.LogWarning("Cannot publish factory order: website bot missing. Start Management API once to seed.");
            return;
        }

        var lines = ExpandSnapshotToVariantLines(snapshotJson);
        if (lines.Count == 0)
        {
            _logger.LogWarning("Website order {OrderId} produced no factory lines", websiteOrderId);
            return;
        }

        var productIds = lines.Select(l => l.ProductId).Distinct().ToList();
        var variants = await _catalog.Variants.AsNoTracking().Where(v => productIds.Contains(v.ProductId)).ToListAsync(ct);

        var orderItems = new List<CatalogOrderItem>();
        var missing = new List<string>();
        foreach (var line in lines)
        {
            var variant = variants.FirstOrDefault(v =>
                v.ProductId == line.ProductId &&
                ColorsMatch(v.Color, line.ColorCode, line.ColorName) &&
                string.Equals(v.Size, line.Size, StringComparison.OrdinalIgnoreCase));
            if (variant is null) { missing.Add($"{line.ProductId}/{line.ColorName}/{line.Size}"); continue; }
            var existing = orderItems.FirstOrDefault(i => i.ProductVariantId == variant.Id);
            if (existing is not null) existing.Quantity += line.Quantity;
            else orderItems.Add(new CatalogOrderItem { ProductVariantId = variant.Id, Quantity = line.Quantity });
        }

        if (orderItems.Count == 0)
        {
            _logger.LogWarning("Website order {OrderId}: no matching variants. Missing: {Missing}", websiteOrderId, string.Join(", ", missing));
            return;
        }

        var noteParts = new List<string>();
        if (!string.IsNullOrWhiteSpace(notes)) noteParts.Add(notes.Trim());
        noteParts.Add($"Website order: {websiteOrderId}");
        if (missing.Count > 0) noteParts.Add("Unmatched: " + string.Join(", ", missing));

        var order = new CatalogOrder
        {
            OrderNumber = $"WEB-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}",
            CustomerName = string.IsNullOrWhiteSpace(customerName) ? "Website customer" : customerName.Trim(),
            Notes = string.Join(" | ", noteParts),
            Status = 0, Source = 1, WebsiteOrderId = websiteOrderId, CreatedByUserId = botUserId,
            Items = orderItems,
            StatusHistory = [ new CatalogOrderStatusHistory { FromStatus = 0, ToStatus = 0, ChangedByUserId = botUserId, Comment = "Автоматически с сайта" } ]
        };
        foreach (var item in order.Items) item.OrderId = order.Id;
        foreach (var h in order.StatusHistory) h.OrderId = order.Id;

        _catalog.Orders.Add(order);
        await _catalog.SaveChangesAsync(ct);
        _logger.LogInformation("Published factory order {FactoryNumber} for website {WebsiteId}", order.OrderNumber, websiteOrderId);
    }

    private async Task<string?> ResolveWebsiteBotUserIdAsync(CancellationToken ct)
    {
        try
        {
            await using var cmd = _catalog.Database.GetDbConnection().CreateCommand();
            if (cmd.Connection!.State != System.Data.ConnectionState.Open)
                await cmd.Connection.OpenAsync(ct);
            cmd.CommandText = """SELECT "Id" FROM mgmt."AspNetUsers" WHERE "Email" = 'website@ekr.local' LIMIT 1""";
            var result = await cmd.ExecuteScalarAsync(ct);
            return result?.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to resolve website bot user");
            return null;
        }
    }

    private static bool ColorsMatch(string variantColor, string colorCode, string colorName) =>
        string.Equals(variantColor, colorName, StringComparison.OrdinalIgnoreCase)
        || string.Equals(variantColor, colorCode, StringComparison.OrdinalIgnoreCase)
        || variantColor.Contains(colorName, StringComparison.OrdinalIgnoreCase)
        || (!string.IsNullOrWhiteSpace(colorCode) && variantColor.Contains(colorCode, StringComparison.OrdinalIgnoreCase));

    private static List<FactoryLine> ExpandSnapshotToVariantLines(string snapshotJson)
    {
        var result = new List<FactoryLine>();
        if (string.IsNullOrWhiteSpace(snapshotJson)) return result;
        try
        {
            using var doc = JsonDocument.Parse(snapshotJson);
            if (!doc.RootElement.TryGetProperty("items", out var items) || items.ValueKind != JsonValueKind.Array)
                return result;
            foreach (var item in items.EnumerateArray())
            {
                if (!item.TryGetProperty("productId", out var pidEl) || !Guid.TryParse(pidEl.GetString(), out var productId))
                    continue;
                var sizes = new List<string>();
                if (item.TryGetProperty("sizes", out var sizesEl) && sizesEl.ValueKind == JsonValueKind.Array)
                    foreach (var s in sizesEl.EnumerateArray())
                        if (!string.IsNullOrWhiteSpace(s.GetString())) sizes.Add(s.GetString()!);
                if (sizes.Count == 0) continue;
                if (!item.TryGetProperty("colorLines", out var colorsEl) || colorsEl.ValueKind != JsonValueKind.Array) continue;
                foreach (var color in colorsEl.EnumerateArray())
                {
                    var code = color.TryGetProperty("colorCode", out var c) ? c.GetString() ?? "" : "";
                    var name = color.TryGetProperty("colorName", out var n) ? n.GetString() ?? code : code;
                    var series = color.TryGetProperty("seriesCount", out var sc) ? sc.GetInt32() : 0;
                    if (series <= 0) continue;
                    foreach (var size in sizes)
                        result.Add(new FactoryLine(productId, code, name, size, series));
                }
            }
        }
        catch { }
        return result;
    }

    private sealed record FactoryLine(Guid ProductId, string ColorCode, string ColorName, string Size, int Quantity);
}

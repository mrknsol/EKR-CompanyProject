using EKR.Application.Interfaces;
using EKR.Infrastructure.Catalog;
using EKR.Shared.DTOs;
using EKR.Shared.Responses;
using Microsoft.EntityFrameworkCore;

namespace EKR.Application.Services;

public class ProductService : IProductService
{
    private readonly CatalogDbContext _catalog;
    public ProductService(CatalogDbContext catalog) => _catalog = catalog;

    public async Task<Response<List<ProductDTO>>> GetProductsAsync()
    {
        var products = await _catalog.Products.AsNoTracking().Include(p => p.Variants)
            .Where(p => p.IsPublished).OrderByDescending(p => p.CreatedAt).ToListAsync();
        return Response<List<ProductDTO>>.Ok(products.Select(ToDto).ToList());
    }

    public async Task<Response<ProductDTO>> GetProductByIdAsync(Guid id)
    {
        var product = await _catalog.Products.AsNoTracking().Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id && p.IsPublished);
        if (product is null) return Response<ProductDTO>.Fail("Product not found");
        return Response<ProductDTO>.Ok(ToDto(product));
    }

    public async Task<Response<ProductDTO>> CreateProductAsync(ProductCreateDTO dto)
    {
        var code = (dto.Code ?? "").Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code)) return Response<ProductDTO>.Fail("Code is required");
        if (await _catalog.Products.AnyAsync(p => p.Code == code))
            return Response<ProductDTO>.Fail($"Code «{code}» already exists");

        var colors = dto.ProductColors ?? [];
        var sizes = dto.ProductSizes ?? [];
        if (colors.Count == 0 || sizes.Count == 0)
            return Response<ProductDTO>.Fail("Colors and sizes are required");

        var stockPerVariant = Math.Max(0, dto.Quantity);
        var variants = new List<CatalogVariant>();
        foreach (var colorRaw in colors)
        {
            var colorName = ParseColorName(colorRaw);
            foreach (var size in sizes)
                variants.Add(new CatalogVariant { Color = colorName, Size = size.Trim(), StockQuantity = stockPerVariant });
        }

        var product = new CatalogProduct
        {
            Id = Guid.NewGuid(),
            Code = code,
            ModelName = $"{dto.ModelType} {code}".Trim(),
            ImagePath = dto.Images?.FirstOrDefault(),
            Price = dto.Price,
            Season = dto.Season?.Trim() ?? "SS",
            ModelType = dto.ModelType?.Trim() ?? "Jacket",
            PiecesPerSeries = Math.Max(1, sizes.Count),
            MinQuantity = Math.Max(1, dto.Quantity),
            ColorMetaJson = CatalogColorMeta.Serialize(colors),
            IsPublished = dto.IsInStock,
            CreatedAt = DateTime.UtcNow,
            Variants = variants
        };
        _catalog.Products.Add(product);
        await _catalog.SaveChangesAsync();
        return Response<ProductDTO>.Ok(ToDto(product));
    }

    public async Task<Response<ProductDTO>> UpdateProductAsync(ProductUpdateDTO dto)
    {
        var product = await _catalog.Products.Include(p => p.Variants).FirstOrDefaultAsync(p => p.Code == dto.Code);
        if (product is null) return Response<ProductDTO>.Fail("Product not found");

        if (dto.Price.HasValue) product.Price = dto.Price.Value;
        if (dto.Season != null) product.Season = dto.Season;
        if (dto.ModelType != null)
        {
            product.ModelType = dto.ModelType;
            product.ModelName = $"{dto.ModelType} {product.Code}".Trim();
        }
        if (dto.IsInStock.HasValue) product.IsPublished = dto.IsInStock.Value;
        if (dto.Quantity.HasValue) product.MinQuantity = Math.Max(1, dto.Quantity.Value);
        if (dto.ProductColors != null) product.ColorMetaJson = CatalogColorMeta.Serialize(dto.ProductColors);
        if (dto.NewImages != null) product.ImagePath = dto.NewImages.FirstOrDefault() ?? product.ImagePath;

        if (dto.ProductSizes != null || dto.ProductColors != null || dto.Quantity.HasValue)
        {
            var colors = dto.ProductColors ?? CatalogColorMeta.Parse(product.ColorMetaJson);
            var sizes = dto.ProductSizes ?? product.Variants.Select(v => v.Size).Distinct().ToList();
            var stock = dto.Quantity ?? product.MinQuantity;
            if (colors.Count > 0 && sizes.Count > 0)
            {
                var usedInOrders = await _catalog.OrderItems.AsNoTracking()
                    .Where(oi => product.Variants.Select(v => v.Id).Contains(oi.ProductVariantId)).AnyAsync();
                if (!usedInOrders)
                {
                    _catalog.Variants.RemoveRange(product.Variants);
                    product.Variants.Clear();
                    foreach (var colorRaw in colors)
                    {
                        var colorName = ParseColorName(colorRaw);
                        foreach (var size in sizes)
                            product.Variants.Add(new CatalogVariant { ProductId = product.Id, Color = colorName, Size = size.Trim(), StockQuantity = Math.Max(0, stock) });
                    }
                    product.PiecesPerSeries = Math.Max(1, sizes.Count);
                }
            }
        }

        product.UpdatedAt = DateTime.UtcNow;
        await _catalog.SaveChangesAsync();
        return Response<ProductDTO>.Ok(ToDto(product));
    }

    public async Task<Response<bool>> DeleteProductAsync(Guid id)
    {
        var product = await _catalog.Products.Include(p => p.Variants).FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return Response<bool>.Fail("Product not found");
        var variantIds = product.Variants.Select(v => v.Id).ToList();
        var used = variantIds.Count > 0 && await _catalog.OrderItems.AsNoTracking().AnyAsync(oi => variantIds.Contains(oi.ProductVariantId));
        if (used)
        {
            product.IsPublished = false;
            product.UpdatedAt = DateTime.UtcNow;
            await _catalog.SaveChangesAsync();
            return Response<bool>.Ok(true, "Product unpublished (used in orders)");
        }
        _catalog.Products.Remove(product);
        await _catalog.SaveChangesAsync();
        return Response<bool>.Ok(true);
    }

    private static ProductDTO ToDto(CatalogProduct p)
    {
        var colors = CatalogColorMeta.Parse(p.ColorMetaJson);
        if (colors.Count == 0)
            colors = p.Variants.Select(v => v.Color).Distinct(StringComparer.OrdinalIgnoreCase).Select(c => $"{c}:{c}:#888888").ToList();
        var sizes = p.Variants.Select(v => v.Size).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(s => s).ToList();
        var imageUrls = string.IsNullOrWhiteSpace(p.ImagePath) ? new List<string>() : new List<string> { p.ImagePath };
        var totalStock = p.Variants.Sum(v => v.StockQuantity);
        return new ProductDTO(p.Id, p.Code, p.ModelType, p.Season, p.Price, p.MinQuantity,
            p.IsPublished && totalStock > 0, colors, sizes, imageUrls, p.PiecesPerSeries, p.ModelName, p.Description ?? "");
    }

    private static string ParseColorName(string raw)
    {
        var parts = raw.Split(':', StringSplitOptions.TrimEntries);
        return parts.Length >= 2 && !string.IsNullOrWhiteSpace(parts[1]) ? parts[1] : parts[0];
    }
}

using System.Text.Json;
using EKR.Application.Interfaces;
using EKR.Domain.Models;
using EKR.Infrastructure.Context;
using EKR.Shared.DTOs;
using EKR.Shared.Responses;
using Microsoft.EntityFrameworkCore;

namespace EKR.Application.Services;

public class OrderService : IOrderService
{
    private readonly EKRApplicationContext _context;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public OrderService(EKRApplicationContext context)
    {
        _context = context;
    }

    public async Task<Response<WholesaleOrderDTO>> CreateAsync(Guid customerId, CreateWholesaleOrderDTO dto)
    {
        try
        {
            if (dto.Items is null || dto.Items.Count == 0)
                return Response<WholesaleOrderDTO>.Fail("Order must contain items");

            var productIds = dto.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .Select(p => p.Id)
                .ToListAsync();

            if (products.Count != productIds.Count)
                return Response<WholesaleOrderDTO>.Fail("One or more products were not found");

            var status = MapStatus(dto.PaymentType == "full" ? "paid" : "pending");
            var orderId = Guid.NewGuid();

            var order = new Order
            {
                Id = orderId,
                CustomerId = customerId,
                TotalAmount = (int)Math.Round(dto.TotalPrice),
                TotalPieces = dto.TotalPieces,
                Status = status,
                CreatedAt = DateTime.UtcNow,
                ShippingAddress = dto.ShippingAddress,
                CustomerPhone = dto.CustomerPhone,
                CustomerComments = dto.CustomerComments,
                PaymentMethod = dto.PaymentMethod,
                PaymentType = dto.PaymentType,
                AmountPaid = dto.AmountPaid,
                BalanceDue = dto.BalanceDue,
                SnapshotJson = PatchSnapshotIds(dto.SnapshotJson, orderId, customerId, status),
                OrderItems = dto.Items.Select(i => new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                }).ToList(),
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            return Response<WholesaleOrderDTO>.Ok(ToDto(order), "Order created");
        }
        catch (Exception ex)
        {
            return Response<WholesaleOrderDTO>.Fail($"Create order failed: {ex.Message}");
        }
    }

    public async Task<Response<List<WholesaleOrderDTO>>> GetMyOrdersAsync(Guid customerId)
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Response<List<WholesaleOrderDTO>>.Ok(orders.Select(ToDto).ToList());
    }

    public async Task<Response<List<WholesaleOrderDTO>>> GetAllOrdersAsync()
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Response<List<WholesaleOrderDTO>>.Ok(orders.Select(ToDto).ToList());
    }

    public async Task<Response<WholesaleOrderDTO>> UpdateStatusAsync(Guid orderId, string status)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
        if (order is null)
            return Response<WholesaleOrderDTO>.Fail("Order not found");

        order.Status = MapStatus(status);
        order.UpdatedAt = DateTime.UtcNow;
        order.SnapshotJson = PatchSnapshotStatus(order.SnapshotJson, order.Status);
        await _context.SaveChangesAsync();

        return Response<WholesaleOrderDTO>.Ok(ToDto(order), "Status updated");
    }

    public async Task<Response<WholesaleOrderDTO>> UpdateSnapshotAsync(
        Guid orderId,
        Guid customerId,
        UpdateOrderSnapshotDTO dto,
        bool isAdmin)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
        if (order is null)
            return Response<WholesaleOrderDTO>.Fail("Order not found");

        if (!isAdmin && order.CustomerId != customerId)
            return Response<WholesaleOrderDTO>.Fail("Forbidden");

        if (order.Status is OrderStatus.Cancelled or OrderStatus.Shipped or OrderStatus.Delivered)
            return Response<WholesaleOrderDTO>.Fail("Order cannot be edited");

        order.SnapshotJson = PatchSnapshotIds(dto.SnapshotJson, order.Id, order.CustomerId, order.Status);
        order.TotalAmount = (int)Math.Round(dto.TotalPrice);
        order.TotalPieces = dto.TotalPieces;
        order.BalanceDue = dto.BalanceDue;
        order.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Response<WholesaleOrderDTO>.Ok(ToDto(order), "Order updated");
    }

    private static WholesaleOrderDTO ToDto(Order order) => new(
        order.Id,
        order.CustomerId,
        ToFrontendStatus(order.Status),
        order.CreatedAt,
        order.SnapshotJson,
        order.PaymentMethod,
        order.PaymentType,
        order.AmountPaid,
        order.BalanceDue,
        order.TotalPieces,
        order.TotalAmount,
        order.ShippingAddress,
        order.CustomerPhone,
        order.CustomerComments
    );

    private static OrderStatus MapStatus(string status) =>
        status.Trim().ToLowerInvariant() switch
        {
            "pending" => OrderStatus.Pending,
            "paid" => OrderStatus.Paid,
            "confirmed" => OrderStatus.Confirmed,
            "shipped" => OrderStatus.Shipped,
            "delivered" => OrderStatus.Delivered,
            "cancelled" => OrderStatus.Cancelled,
            _ => OrderStatus.Pending,
        };

    private static string ToFrontendStatus(OrderStatus status) =>
        status switch
        {
            OrderStatus.Pending => "pending",
            OrderStatus.Paid => "paid",
            OrderStatus.Confirmed => "confirmed",
            OrderStatus.Shipped => "shipped",
            OrderStatus.Delivered => "shipped",
            OrderStatus.Cancelled => "cancelled",
            _ => "pending",
        };

    private static string PatchSnapshotIds(string snapshotJson, Guid orderId, Guid customerId, OrderStatus status)
    {
        try
        {
            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(snapshotJson) ? "{}" : snapshotJson);
            var root = doc.RootElement.Clone();
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                writer.WriteStartObject();
                var written = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                void WriteProp(string name, Action write)
                {
                    if (written.Add(name))
                    {
                        writer.WritePropertyName(name);
                        write();
                    }
                }

                WriteProp("id", () => writer.WriteStringValue(orderId.ToString()));
                WriteProp("userId", () => writer.WriteStringValue(customerId.ToString()));
                WriteProp("status", () => writer.WriteStringValue(ToFrontendStatus(status)));

                foreach (var prop in root.EnumerateObject())
                {
                    if (prop.NameEquals("id") || prop.NameEquals("userId") || prop.NameEquals("status"))
                        continue;
                    prop.WriteTo(writer);
                    written.Add(prop.Name);
                }

                writer.WriteEndObject();
            }

            return System.Text.Encoding.UTF8.GetString(stream.ToArray());
        }
        catch
        {
            return snapshotJson;
        }
    }

    private static string PatchSnapshotStatus(string snapshotJson, OrderStatus status)
    {
        try
        {
            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(snapshotJson) ? "{}" : snapshotJson);
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                writer.WriteStartObject();
                var hasStatus = false;
                foreach (var prop in doc.RootElement.EnumerateObject())
                {
                    if (prop.NameEquals("status"))
                    {
                        writer.WriteString("status", ToFrontendStatus(status));
                        hasStatus = true;
                    }
                    else
                    {
                        prop.WriteTo(writer);
                    }
                }
                if (!hasStatus)
                    writer.WriteString("status", ToFrontendStatus(status));
                writer.WriteEndObject();
            }
            return System.Text.Encoding.UTF8.GetString(stream.ToArray());
        }
        catch
        {
            return snapshotJson;
        }
    }
}

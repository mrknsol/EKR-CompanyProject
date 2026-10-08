using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace EKR.Infrastructure.Converters;

public sealed class OrderStatusValueConverter : ValueConverter<OrderStatus, string>
{
    public OrderStatusValueConverter()
        : base(
            v => ToStorage(v),
            v => FromStorage(v))
    {
    }

    public static string ToStorage(OrderStatus status) => status.ToString();

    public static OrderStatus FromStorage(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return OrderStatus.Accepted;

        return value.Trim().ToLowerInvariant() switch
        {
            "accepted" or "pending" => OrderStatus.Accepted,
            "inproduction" or "in_production" or "confirmed" => OrderStatus.InProduction,
            "ready" => OrderStatus.Ready,
            "paid" => OrderStatus.Paid,
            "intransit" or "in_transit" or "shipped" => OrderStatus.InTransit,
            "delivered" => OrderStatus.Delivered,
            "cancelled" or "canceled" => OrderStatus.Cancelled,
            _ => Enum.TryParse<OrderStatus>(value, true, out var parsed)
                ? parsed
                : OrderStatus.Accepted,
        };
    }
}

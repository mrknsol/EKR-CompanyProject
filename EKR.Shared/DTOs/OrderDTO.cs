namespace EKR.Shared.DTOs;

public record OrderDTO(
    Guid Id,
    Guid CustomerId,
    int TotalAmount,
    string Status,
    DateTime CreatedAt,
    string ShippingAddress,
    List<OrderItemDetailsDTO> Items
);
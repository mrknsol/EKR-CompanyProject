namespace EKR.Shared.DTOs;

public record CreateOrderDTO(
    Guid CustomerId,
    List<OrderItemDTO> Items,
    string ShippingAddress,
    string CustomerPhone,
    string? CustomerComments
);
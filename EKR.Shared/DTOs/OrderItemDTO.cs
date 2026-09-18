namespace EKR.Shared.DTOs;
public record OrderItemDTO(
    Guid ProductId,
    int Quantity
);
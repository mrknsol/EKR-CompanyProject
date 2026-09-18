namespace EKR.Shared.DTOs;

public record OrderItemDetailsDTO(
    Guid ProductId,
    string ProductCode,
    int Quantity,
    decimal TotalPrice
);
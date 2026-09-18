namespace EKR.Shared.DTOs;

public record PaymentDTO(
        Guid Id,
        Guid OrderId,
        Guid UserId,
        decimal Amount,
        string PaymentMethod,
        string Status,
        DateTime PaymentDate,
        string? TransactionId
    );
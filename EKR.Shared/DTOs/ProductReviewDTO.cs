namespace EKR.Shared.DTOs;

public record ProductReviewDTO(
        Guid Id,
        Guid UserId,
        Guid ProductId,
        int Rating,
        string Comment,
        DateTime CreatedAt,
        bool IsApproved,
        string UserName
    );
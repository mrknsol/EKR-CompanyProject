namespace EKR.Shared.DTOs;

public record CreateOrderLineDTO(Guid ProductId, int Quantity);

public record CreateWholesaleOrderDTO(
    string SnapshotJson,
    string PaymentMethod,
    string PaymentType,
    decimal AmountPaid,
    decimal BalanceDue,
    int TotalPieces,
    decimal TotalPrice,
    string ShippingAddress,
    string? CustomerPhone,
    string? CustomerComments,
    List<CreateOrderLineDTO> Items
);

public record UpdateOrderStatusDTO(string Status);

public record UpdateOrderSnapshotDTO(string SnapshotJson, decimal TotalPrice, int TotalPieces, decimal BalanceDue);

public record WholesaleOrderDTO(
    Guid Id,
    Guid CustomerId,
    string Status,
    DateTime CreatedAt,
    string SnapshotJson,
    string PaymentMethod,
    string PaymentType,
    decimal AmountPaid,
    decimal BalanceDue,
    int TotalPieces,
    decimal TotalPrice,
    string ShippingAddress,
    string? CustomerPhone,
    string? CustomerComments
);

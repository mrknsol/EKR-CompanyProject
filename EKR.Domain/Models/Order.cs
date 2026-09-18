namespace EKR.Domain.Models;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }

    public int TotalAmount { get; set; }
    public int TotalPieces { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public string ShippingAddress { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string? CustomerComments { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentType { get; set; } = "deposit";
    public decimal AmountPaid { get; set; }
    public decimal BalanceDue { get; set; }

    /// <summary>Full frontend order snapshot (items, customer form, revisions).</summary>
    public string SnapshotJson { get; set; } = "{}";

    public User Customer { get; set; } = null!;
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

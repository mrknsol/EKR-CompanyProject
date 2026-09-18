namespace EKR.Domain.Models;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid UserId { get; set;}
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set;}
    public string Status { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public string? TransactionId { get; set; }
    public Order Order { get; set; }
    public User User { get; set;}
}
namespace EKR.Domain.Models;

public class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; } 
    
    public Order Order { get; set; }
    public Product Product { get; set; }
}
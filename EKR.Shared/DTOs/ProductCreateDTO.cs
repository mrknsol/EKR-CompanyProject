
using Microsoft.AspNetCore.Http;

namespace EKR.Shared.DTOs;
public class ProductCreateDTO
{
    public string Code { get; set; }
    public int Price { get; set; }
    public int Quantity { get; set; }
    public bool IsInStock { get; set; }
    public string ModelType { get; set; }
    public string Season { get; set; }

    public List<string>? ProductSizes { get; set; }
    public List<string>? ProductColors { get; set; }

    public List<string>? Images { get; set; }
    
}
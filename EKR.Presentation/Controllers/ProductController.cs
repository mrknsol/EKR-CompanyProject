using EKR.Application.Interfaces;
using EKR.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EKR.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductController : ControllerBase {
    private readonly IProductService _productService;
    private readonly IFileStorageService _fileStorageService;
    
    public ProductController(IProductService productService, IFileStorageService fileStorageService) 
    {
        _productService = productService;
        _fileStorageService = fileStorageService;
    }

    [HttpGet("GetProducts")]
    public async Task<IActionResult> GetProducts() 
    {
        var result = await _productService.GetProductsAsync();
        
        if (!result.Success) {
            return BadRequest(result.Message);
        }
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProductById(Guid id) 
    {
        var result = await _productService.GetProductByIdAsync(id);

        if (!result.Success) 
        {
            return BadRequest(result.Message);
        }
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("CreateProduct")]
    public async Task<IActionResult> CreateProduct([FromBody] ProductCreateDTO productDTO)
    {
        if (productDTO == null) 
        {
            return BadRequest("Product data is null");
        }
        var result = await _productService.CreateProductAsync(productDTO);
        if (!result.Success) 
        {
            return BadRequest(result.Message);
        }
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        var result = await _productService.DeleteProductAsync(id);
        if (!result.Success) 
        {
            return BadRequest(result.Message);
        }
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("UpdateProduct")]
    public async Task<IActionResult> UpdateProduct([FromBody] ProductUpdateDTO productDTO)
    {
        var result = await _productService.UpdateProductAsync(productDTO);
        if (!result.Success) 
        {
            return BadRequest(result.Message);
        }
        return Ok(result);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("UploadImage")]
    public async Task<IActionResult> UploadPhoto(IFormFile file)
    {
        var result = await _fileStorageService.UploadFileAsync(file);
        if (result == null) 
        {
            return BadRequest("Error uploading file");
        }
        return Ok(result);
    }   
}
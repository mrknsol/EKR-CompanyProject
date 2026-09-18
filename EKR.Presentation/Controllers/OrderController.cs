using EKR.Application.Interfaces;
using EKR.Presentation.Extensions;
using EKR.Shared.DTOs;
using EKR.Shared.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EKR.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrderController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrderController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWholesaleOrderDTO dto)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(Response<WholesaleOrderDTO>.Fail("Invalid token"));

        var result = await _orderService.CreateAsync(userId.Value, dto);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(Response<List<WholesaleOrderDTO>>.Fail("Invalid token"));

        var result = await _orderService.GetMyOrdersAsync(userId.Value);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> GetAll()
    {
        var result = await _orderService.GetAllOrdersAsync();
        return Ok(result);
    }

    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusDTO dto)
    {
        var result = await _orderService.UpdateStatusAsync(id, dto.Status);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id:guid}/snapshot")]
    public async Task<IActionResult> UpdateSnapshot(Guid id, [FromBody] UpdateOrderSnapshotDTO dto)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(Response<WholesaleOrderDTO>.Fail("Invalid token"));

        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager");
        var result = await _orderService.UpdateSnapshotAsync(id, userId.Value, dto, isAdmin);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
}

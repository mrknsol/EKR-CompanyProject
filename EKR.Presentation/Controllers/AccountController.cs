using EKR.Application.Interfaces;
using EKR.Presentation.Extensions;
using EKR.Shared.DTOs;
using EKR.Shared.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EKR.Presentation.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AccountController : ControllerBase
{
    private readonly IAccountService _accountService;

    public AccountController(IAccountService accountService)
    {
        _accountService = accountService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(Response<ProfileDTO>.Fail("Invalid token"));

        var result = await _accountService.GetProfileAsync(userId.Value);
        if (result is null || !result.Success)
            return NotFound(result ?? Response<ProfileDTO>.Fail("User not found"));

        return Ok(result);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDTO dto)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(EmptyResponse.Fail("Invalid token"));

        var updated = await _accountService.UpdateProfileAsync(userId.Value, dto);
        if (!updated)
            return NotFound(EmptyResponse.Fail("User not found"));

        var result = await _accountService.GetProfileAsync(userId.Value);
        return Ok(result);
    }

    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUsers()
    {
        var result = await _accountService.GetAllUsersAsync();
        return Ok(result);
    }
}

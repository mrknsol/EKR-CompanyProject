using EKR.Application.Interfaces;
using EKR.Presentation.Extensions;
using EKR.Shared.DTOs;
using EKR.Shared.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EKR.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDTO loginDto)
    {
        var result = await _authService.LoginAsync(loginDto);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterDTO registerDto)
    {
        var result = await _authService.RegisterAsync(registerDto);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("validate")]
    [Authorize]
    public async Task<IActionResult> ValidateToken()
    {
        var header = Request.Headers.Authorization.ToString();
        var token = header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? header["Bearer ".Length..].Trim()
            : header;

        var result = await _authService.ValidateTokenAsync(token);
        return Ok(result);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var result = await _authService.RefreshTokenAsync(request.RefreshToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Ok(EmptyResponse.Ok("Logged out"));

        var result = await _authService.LogoutAsync(userId.Value);
        return Ok(result);
    }
}

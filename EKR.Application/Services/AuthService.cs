using EKR.Application.Interfaces;
using EKR.Domain.Models;
using EKR.Shared.DTOs;
using EKR.Shared.Responses;
using EKR.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;


namespace EKR.Application.Services;

public class AuthService : IAuthService
{
    private readonly EKRApplicationContext _context;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;

    public AuthService(EKRApplicationContext context, ITokenService tokenService, IConfiguration configuration)
    {
        _context = context;
        _tokenService = tokenService;
        _configuration = configuration;
    }

    public async Task<Response<AuthResponseDTO>> LoginAsync(LoginDTO loginDto)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.AppRole)
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.Password))
                return Response<AuthResponseDTO>.Fail("Invalid email or password");

            var roles = user.UserRoles.Select(ur => ur.AppRole.Name).ToList();
            var token = _tokenService.GenerateToken(user.Id, user.Email, roles);

            user.RefreshToken = _tokenService.GenerateRefreshToken();
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();

            var expiryHours = Convert.ToDouble(_configuration["Jwt:ExpiryHours"]);
            var response = new AuthResponseDTO(
                token, 
                DateTime.UtcNow.AddHours(expiryHours), 
                user.RefreshToken,
                user.RefreshTokenExpiryTime.Value,
                user.Id, 
                user.Email, 
                $"{user.Name} {user.Surname}",
                roles);

            return Response<AuthResponseDTO>.Ok(response, "Login successful");
        }
        catch (Exception ex)
        {
            return Response<AuthResponseDTO>.Fail($"Login failed: {ex.Message}");
        }
    }

    public async Task<Response<AuthResponseDTO>> RegisterAsync(RegisterDTO registerDto)
    {
        try
        {
            if (registerDto.Password != registerDto.ConfirmPassword)
                return Response<AuthResponseDTO>.Fail("Passwords do not match");

            if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
                return Response<AuthResponseDTO>.Fail("User with this email already exists");

            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = registerDto.FirstName,
                Surname = registerDto.LastName,
                Email = registerDto.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                Country = registerDto.Country,
                PhoneNumber = registerDto.PhoneNumber,
                CreatedAt = DateTime.UtcNow,
                IsEmailVerified = false
            };

            var userRole = await _context.AppRoles.FirstOrDefaultAsync(r => r.Name == "User");
            if (userRole != null)
            {
                user.UserRoles = new List<UserRole> 
                { 
                    new UserRole 
                    { 
                        Id = Guid.NewGuid(),
                        RoleId = userRole.Id,
                        UserId = user.Id
                    } 
                };
            }

            user.RefreshToken = _tokenService.GenerateRefreshToken();
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var expiryHours = Convert.ToDouble(_configuration["Jwt:ExpiryHours"]);
            var token = _tokenService.GenerateToken(user.Id, user.Email, new[] { "User" });

            var response = new AuthResponseDTO(
                token,
                DateTime.UtcNow.AddHours(expiryHours),
                user.RefreshToken,
                user.RefreshTokenExpiryTime.Value,
                user.Id,
                user.Email,
                $"{user.Name} {user.Surname}",
                new List<string> { "User" });

            return Response<AuthResponseDTO>.Ok(response, "Registration successful");
        }
        catch (Exception ex)
        {
            return Response<AuthResponseDTO>.Fail($"Registration failed: {ex.Message}");
        }
    }

    public async Task<Response<bool>> ValidateTokenAsync(string token)
    {
        try
        {
            var isValid = _tokenService.ValidateToken(token);
            return Response<bool>.Ok(isValid, "Token validation completed");
        }
        catch (Exception ex)
        {
            return Response<bool>.Fail($"Token validation failed: {ex.Message}");
        }
    }

    public async Task<Response<AuthResponseDTO>> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.AppRole)
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken && 
                                         u.RefreshTokenExpiryTime > DateTime.UtcNow);

            if (user == null)
                return Response<AuthResponseDTO>.Fail("Invalid or expired refresh token");

            var roles = user.UserRoles.Select(ur => ur.AppRole.Name).ToList();
            var newToken = _tokenService.GenerateToken(user.Id, user.Email, roles);
            
            user.RefreshToken = _tokenService.GenerateRefreshToken();
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();

            var expiryHours = Convert.ToDouble(_configuration["Jwt:ExpiryHours"]);
            var response = new AuthResponseDTO(
                newToken, 
                DateTime.UtcNow.AddHours(expiryHours),
                user.RefreshToken,
                user.RefreshTokenExpiryTime.Value,
                user.Id, 
                user.Email, 
                $"{user.Name} {user.Surname}",
                roles);
            
            return Response<AuthResponseDTO>.Ok(response, "Token refreshed successfully");
        }
        catch (Exception ex)
        {
            return Response<AuthResponseDTO>.Fail($"Refresh token failed: {ex.Message}");
        }
    }

    public async Task<EmptyResponse> LogoutAsync(Guid userId)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;
                await _context.SaveChangesAsync();
            }
            
            return EmptyResponse.Ok("Logged out successfully");
        }
        catch (Exception ex)
        {
            return EmptyResponse.Fail($"Logout failed: {ex.Message}");
        }
    }
}
using EKR.Shared.DTOs;
using EKR.Shared.Responses;

namespace EKR.Application.Interfaces;

public interface IAuthService {
    Task<Response<AuthResponseDTO>> LoginAsync(LoginDTO loginData);
    Task<Response<AuthResponseDTO>> RegisterAsync(RegisterDTO registerData);
    Task<Response<bool>> ValidateTokenAsync(string token);
    Task<Response<AuthResponseDTO>> RefreshTokenAsync(string RefreshToken);
    Task<EmptyResponse> LogoutAsync(Guid userId);

}
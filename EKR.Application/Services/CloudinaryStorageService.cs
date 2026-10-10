using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EKR.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace EKR.Application.Services;

public class CloudinaryStorageService : IFileStorageService
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private readonly HttpClient _httpClient;
    private readonly string _cloudName;
    private readonly string _apiKey;
    private readonly string _apiSecret;
    private readonly string _folder;

    public CloudinaryStorageService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _cloudName = config["Cloudinary:CloudName"] ?? "";
        _apiKey = config["Cloudinary:ApiKey"] ?? "";
        _apiSecret = config["Cloudinary:ApiSecret"] ?? "";
        _folder = config["Cloudinary:Folder"] ?? "ekr/products";
    }

    public static bool IsConfigured(IConfiguration config) =>
        !string.IsNullOrWhiteSpace(config["Cloudinary:CloudName"]) &&
        !string.IsNullOrWhiteSpace(config["Cloudinary:ApiKey"]) &&
        !string.IsNullOrWhiteSpace(config["Cloudinary:ApiSecret"]);

    public async Task<string> UploadFileAsync(IFormFile file)
    {
        if (string.IsNullOrWhiteSpace(_cloudName) ||
            string.IsNullOrWhiteSpace(_apiKey) ||
            string.IsNullOrWhiteSpace(_apiSecret))
        {
            throw new InvalidOperationException("Cloudinary is not configured.");
        }

        if (file.Length == 0)
            throw new InvalidOperationException("Empty image file.");

        var ext = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(ext))
            throw new InvalidOperationException("Only jpg, jpeg, png, webp are allowed.");

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var signParams = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["timestamp"] = timestamp
        };
        if (!string.IsNullOrWhiteSpace(_folder))
            signParams["folder"] = _folder;

        var signature = CreateSignature(signParams, _apiSecret);

        using var content = new MultipartFormDataContent();
        await using var stream = file.OpenReadStream();
        var streamContent = new StreamContent(stream);
        streamContent.Headers.ContentType = new MediaTypeHeaderValue(
            string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType);
        content.Add(streamContent, "file", file.FileName);
        content.Add(new StringContent(_apiKey), "api_key");
        content.Add(new StringContent(timestamp), "timestamp");
        content.Add(new StringContent(signature), "signature");
        if (!string.IsNullOrWhiteSpace(_folder))
            content.Add(new StringContent(_folder), "folder");

        var url = $"https://api.cloudinary.com/v1_1/{_cloudName}/image/upload";
        using var response = await _httpClient.PostAsync(url, content);
        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Cloudinary upload failed: {body}");

        using var doc = JsonDocument.Parse(body);
        if (!doc.RootElement.TryGetProperty("secure_url", out var secureUrl))
            throw new InvalidOperationException("Cloudinary did not return secure_url.");

        return secureUrl.GetString()
            ?? throw new InvalidOperationException("Cloudinary returned empty secure_url.");
    }

    private static string CreateSignature(SortedDictionary<string, string> parameters, string apiSecret)
    {
        var toSign = string.Join("&", parameters.Select(p => $"{p.Key}={p.Value}")) + apiSecret;
        var hash = SHA1.HashData(Encoding.UTF8.GetBytes(toSign));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}

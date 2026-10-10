using EKR.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Minio;
using Minio.DataModel.Args;

namespace EKR.Application.Services;

public class MinioStorageService : IFileStorageService
{
    private readonly IMinioClient _client;
    private readonly string _bucketName;
    private readonly string _publicBaseUrl;
    private readonly SemaphoreSlim _bucketLock = new(1, 1);
    private bool _bucketReady;

    public MinioStorageService(IConfiguration config)
    {
        _bucketName = config["Minio:BucketName"] ?? "product-images";
        var endpoint = config["Minio:Endpoint"] ?? "localhost:9000";
        var useSsl = bool.TryParse(config["Minio:UseSSL"], out var ssl) && ssl;
        _publicBaseUrl = $"{(useSsl ? "https" : "http")}://{endpoint}/{_bucketName}";

        _client = new MinioClient()
            .WithEndpoint(endpoint)
            .WithCredentials(config["Minio:AccessKey"], config["Minio:SecretKey"])
            .WithSSL(useSsl)
            .Build();
    }

    private async Task EnsureBucketExistsAsync()
    {
        if (_bucketReady) return;

        await _bucketLock.WaitAsync();
        try
        {
            if (_bucketReady) return;
            var exists = await _client.BucketExistsAsync(new BucketExistsArgs().WithBucket(_bucketName));
            if (!exists)
                await _client.MakeBucketAsync(new MakeBucketArgs().WithBucket(_bucketName));
            _bucketReady = true;
        }
        finally
        {
            _bucketLock.Release();
        }
    }

    public async Task<string> UploadFileAsync(IFormFile file)
    {
        await EnsureBucketExistsAsync();

        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        await using var stream = file.OpenReadStream();

        await _client.PutObjectAsync(new PutObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(fileName)
            .WithStreamData(stream)
            .WithObjectSize(file.Length)
            .WithContentType(file.ContentType));

        return $"{_publicBaseUrl}/{fileName}";
    }
}

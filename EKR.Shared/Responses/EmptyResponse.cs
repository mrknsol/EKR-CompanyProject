namespace EKR.Shared.Responses;

public class EmptyResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string> Errors { get; set; } = new();

    public static EmptyResponse Ok(string message = "Success") => new()
    {
        Success = true,
        Message = message
    };

    public static EmptyResponse Fail(string message, List<string>? errors = null) => new()
    {
        Success = false,
        Message = message,
        Errors = errors ?? new List<string>()
    };

    public static EmptyResponse Fail(string message) => new()
    {
        Success = false,
        Message = message,
        Errors = new List<string>()
    };
}
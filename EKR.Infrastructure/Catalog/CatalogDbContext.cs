using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace EKR.Infrastructure.Catalog;

public class CatalogProduct
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImagePath { get; set; }
    public int Price { get; set; }
    public string Season { get; set; } = "SS";
    public string ModelType { get; set; } = "Jacket";
    public int PiecesPerSeries { get; set; } = 4;
    public int MinQuantity { get; set; } = 1;
    public string ColorMetaJson { get; set; } = "[]";
    public bool IsPublished { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public ICollection<CatalogVariant> Variants { get; set; } = new List<CatalogVariant>();
}

public class CatalogVariant
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public CatalogProduct Product { get; set; } = null!;
    public string Color { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
}

public class CatalogOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public int Status { get; set; }
    public int Source { get; set; } = 1;
    public Guid? WebsiteOrderId { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool StockDeducted { get; set; }
    public ICollection<CatalogOrderItem> Items { get; set; } = new List<CatalogOrderItem>();
    public ICollection<CatalogOrderStatusHistory> StatusHistory { get; set; } = new List<CatalogOrderStatusHistory>();
}

public class CatalogOrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public CatalogOrder Order { get; set; } = null!;
    public Guid ProductVariantId { get; set; }
    public int Quantity { get; set; }
}

public class CatalogOrderStatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public CatalogOrder Order { get; set; } = null!;
    public int FromStatus { get; set; }
    public int ToStatus { get; set; }
    public string ChangedByUserId { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}

public class CatalogDbContext : DbContext
{
    public const string Schema = "mgmt";
    public CatalogDbContext(DbContextOptions<CatalogDbContext> options) : base(options) { }

    public DbSet<CatalogProduct> Products => Set<CatalogProduct>();
    public DbSet<CatalogVariant> Variants => Set<CatalogVariant>();
    public DbSet<CatalogOrder> Orders => Set<CatalogOrder>();
    public DbSet<CatalogOrderItem> OrderItems => Set<CatalogOrderItem>();
    public DbSet<CatalogOrderStatusHistory> OrderStatusHistories => Set<CatalogOrderStatusHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.Entity<CatalogProduct>(e =>
        {
            e.ToTable("Products");
            e.HasKey(x => x.Id);
            e.Property(x => x.ColorMetaJson).HasColumnType("jsonb");
            e.HasMany(x => x.Variants).WithOne(v => v.Product).HasForeignKey(v => v.ProductId);
        });
        modelBuilder.Entity<CatalogVariant>(e => { e.ToTable("ProductVariants"); e.HasKey(x => x.Id); });
        modelBuilder.Entity<CatalogOrder>(e =>
        {
            e.ToTable("Orders");
            e.HasKey(x => x.Id);
            e.HasMany(x => x.Items).WithOne(i => i.Order).HasForeignKey(i => i.OrderId);
            e.HasMany(x => x.StatusHistory).WithOne(h => h.Order).HasForeignKey(h => h.OrderId);
        });
        modelBuilder.Entity<CatalogOrderItem>(e => { e.ToTable("OrderItems"); e.HasKey(x => x.Id); });
        modelBuilder.Entity<CatalogOrderStatusHistory>(e => { e.ToTable("OrderStatusHistories"); e.HasKey(x => x.Id); });
    }
}

public static class CatalogColorMeta
{
    private static readonly JsonSerializerOptions Opts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    public static List<string> Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try { return JsonSerializer.Deserialize<List<string>>(json, Opts) ?? []; }
        catch { return []; }
    }
    public static string Serialize(IEnumerable<string> colors) => JsonSerializer.Serialize(colors.ToList(), Opts);
}

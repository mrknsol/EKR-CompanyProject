using EKR.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;

namespace EKR.Infrastructure.Context;

    public class EKRApplicationContext : DbContext
    {
        public EKRApplicationContext(DbContextOptions<EKRApplicationContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<AppRole> AppRoles { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<ProductReview> ProductReviews { get; set; }
        public DbSet<ShippingAddress> ShippingAddresses { get; set; }
        public DbSet<Payment> Payments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            var jsonSerializerOptions = new JsonSerializerOptions 
            { 
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            };

            var listStringConverter = new ValueConverter<List<string>, string>(
                v => JsonSerializer.Serialize(v, jsonSerializerOptions),
                v => JsonSerializer.Deserialize<List<string>>(v, jsonSerializerOptions) ?? new List<string>());

            var listStringComparer = new ValueComparer<List<string>>(
                (c1, c2) => c1.SequenceEqual(c2),
                c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                c => c.ToList());

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.HasIndex(u => u.Email).IsUnique();
                entity.HasIndex(u => u.PhoneNumber).IsUnique();
                entity.HasIndex(u => u.GoogleId).IsUnique().HasFilter("[GoogleId] IS NOT NULL");
                entity.HasIndex(u => u.WeChatId).IsUnique().HasFilter("[WeChatId] IS NOT NULL");

                entity.Property(u => u.Name).IsRequired().HasMaxLength(100);
                entity.Property(u => u.Surname).IsRequired().HasMaxLength(100);
                entity.Property(u => u.Email).IsRequired().HasMaxLength(256);
                entity.Property(u => u.Password).IsRequired().HasMaxLength(256);
                entity.Property(u => u.Country).HasMaxLength(100);
                entity.Property(u => u.PhoneNumber).HasMaxLength(20);
                entity.Property(u => u.PasswordResetCode).HasMaxLength(6);
                entity.Property(u => u.RefreshToken).HasMaxLength(500);

                entity.HasMany(u => u.Orders)
                    .WithOne(o => o.Customer)
                    .HasForeignKey(o => o.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(u => u.UserRoles)
                    .WithOne(ur => ur.User)
                    .HasForeignKey(ur => ur.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(u => u.LikedProducts)
                    .WithMany()
                    .UsingEntity<Dictionary<string, object>>(
                        "UserLikedProducts",
                        j => j.HasOne<Product>().WithMany().HasForeignKey("ProductId"),
                        j => j.HasOne<User>().WithMany().HasForeignKey("UserId"),
                        j =>
                        {
                            j.HasKey("UserId", "ProductId");
                            j.HasIndex("ProductId");
                        });

                entity.HasMany(u => u.ShippingAddresses)
                    .WithOne(sa => sa.User)
                    .HasForeignKey(sa => sa.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(u => u.Payments)
                    .WithOne(p => p.User)
                    .HasForeignKey(p => p.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(u => u.ProductReviews)
                    .WithOne(pr => pr.User)
                    .HasForeignKey(pr => pr.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.HasIndex(p => p.Code).IsUnique();

                entity.Property(p => p.Code).IsRequired().HasMaxLength(50);
                entity.Property(p => p.ModelType).IsRequired().HasMaxLength(100);
                entity.Property(p => p.Season).IsRequired().HasMaxLength(50);
                entity.Property(p => p.Price).IsRequired();
                entity.Property(p => p.Quantity).IsRequired().HasDefaultValue(0);
                entity.Property(p => p.IsInStock).IsRequired().HasDefaultValue(true);

                entity.Property(p => p.ImageUrls)
                    .HasConversion(listStringConverter)
                    .HasColumnType("jsonb")
                    .Metadata.SetValueComparer(listStringComparer);

                entity.Property(p => p.ProductColors)
                    .HasConversion(listStringConverter)
                    .HasColumnType("jsonb")
                    .Metadata.SetValueComparer(listStringComparer);

                entity.Property(p => p.ProductSizes)
                    .HasConversion(listStringConverter)
                    .HasColumnType("jsonb")
                    .Metadata.SetValueComparer(listStringComparer);

                entity.HasMany(p => p.OrderItems)
                    .WithOne(oi => oi.Product)
                    .HasForeignKey(oi => oi.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(p => p.ProductReviews)
                    .WithOne(pr => pr.Product)
                    .HasForeignKey(pr => pr.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(o => o.Id);
                
                entity.Property(o => o.TotalAmount).IsRequired();
                entity.Property(o => o.TotalPieces).IsRequired();
                entity.Property(o => o.Status).IsRequired().HasConversion<string>();
                entity.Property(o => o.ShippingAddress).IsRequired().HasMaxLength(500);
                entity.Property(o => o.CreatedAt).IsRequired();
                entity.Property(o => o.PaymentMethod).HasMaxLength(100);
                entity.Property(o => o.PaymentType).HasMaxLength(32);
                entity.Property(o => o.SnapshotJson).HasColumnType("text");
                
                entity.HasMany(o => o.OrderItems)
                    .WithOne(oi => oi.Order)
                    .HasForeignKey(oi => oi.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(o => o.Payments)
                    .WithOne(p => p.Order)
                    .HasForeignKey(p => p.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasKey(oi => oi.Id);
                
                entity.Property(oi => oi.Quantity).IsRequired();
                entity.HasIndex(oi => new { oi.OrderId, oi.ProductId });
            });

            modelBuilder.Entity<AppRole>(entity =>
            {
                entity.HasKey(r => r.Id);
                entity.HasIndex(r => r.Name).IsUnique();

                entity.Property(r => r.Name).IsRequired().HasMaxLength(100);

                entity.HasMany(r => r.UserRoles)
                    .WithOne(ur => ur.AppRole)
                    .HasForeignKey(ur => ur.RoleId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.HasKey(ur => ur.Id);
                
                entity.HasIndex(ur => new { ur.UserId, ur.RoleId }).IsUnique();

                entity.HasOne(ur => ur.User)
                    .WithMany(u => u.UserRoles)
                    .HasForeignKey(ur => ur.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ur => ur.AppRole)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(ur => ur.RoleId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ProductReview>(entity =>
            {
                entity.HasKey(pr => pr.Id);
                
                entity.Property(pr => pr.Rating).IsRequired();
                entity.Property(pr => pr.Comment).HasMaxLength(1000);
                entity.Property(pr => pr.CreatedAt).IsRequired();
                
                entity.HasIndex(pr => new { pr.UserId, pr.ProductId }).IsUnique();
            });

            modelBuilder.Entity<ShippingAddress>(entity =>
            {
                entity.HasKey(sa => sa.Id);
                
                entity.Property(sa => sa.AddressLine1).IsRequired().HasMaxLength(200);
                entity.Property(sa => sa.City).IsRequired().HasMaxLength(100);
                entity.Property(sa => sa.PostalCode).IsRequired().HasMaxLength(20);
                entity.Property(sa => sa.Country).IsRequired().HasMaxLength(100);
            });

            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasKey(p => p.Id);
                
                entity.Property(p => p.Amount).IsRequired().HasColumnType("decimal(18,2)");
                entity.Property(p => p.PaymentMethod).IsRequired().HasMaxLength(50);
                entity.Property(p => p.Status).IsRequired().HasMaxLength(20);
                entity.Property(p => p.PaymentDate).IsRequired();
                entity.Property(p => p.TransactionId).HasMaxLength(100);
                
                entity.HasIndex(p => p.TransactionId).IsUnique().HasFilter("\"TransactionId\" IS NOT NULL");
            });

            modelBuilder.Entity<AppRole>().HasData(
                new AppRole { Id = new Guid("00000000-0000-0000-0000-000000000001"), Name = "Admin" },
                new AppRole { Id = new Guid("00000000-0000-0000-0000-000000000002"), Name = "User" },
                new AppRole { Id = new Guid("00000000-0000-0000-0000-000000000003"), Name = "Manager" }
            );
        }

        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            configurationBuilder.Properties<List<string>>().HaveConversion<ListStringConverter>();
        }
    }

    public class ListStringConverter : ValueConverter<List<string>, string>
    {
        public ListStringConverter()
            : base(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null) ?? new List<string>())
        {
        }
    }

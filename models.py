from django.db import models
from django.utils import timezone

class Customer(models.Model):
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=200)
    email = models.CharField(max_length=150)
    address = models.JSONField(null=True, blank=True) 

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class ProductCategory(models.Model):
    name = models.CharField(max_length=150)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(null=True, blank=True)
    remaining_amount = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    categories = models.ManyToManyField(ProductCategory, related_name='products')

    def __str__(self):
        return self.name


class Cart(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    create_date = models.DateTimeField(default=timezone.now)
    expired_in = models.IntegerField(default=60) 


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    amount = models.IntegerField(default=1)


class Order(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    order_date = models.DateField()
    remark = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Order {self.id} by {self.customer}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    amount = models.IntegerField(default=1)


class Payment(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    payment_date = models.DateField()
    remark = models.TextField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)


class PaymentItem(models.Model):
    # Removed duplicate field `order_item` (you had two!)
    order_item = models.OneToOneField(OrderItem, on_delete=models.CASCADE)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)


# ENUM for PaymentMethod
class PaymentMethodChoices(models.TextChoices):
    QR = "QR", "QR Code"
    CREDIT = "CREDIT", "Credit Card"


class PaymentMethod(models.Model):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE)
    method = models.CharField(max_length=10, choices=PaymentMethodChoices.choices)
    price = models.DecimalField(max_digits=10, decimal_places=2)

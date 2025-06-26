from django.core.management.base import BaseCommand
from MallAPI.models.payment_model import Payment
from MallAPI.services.delivery_services import DeliveryService

class Command(BaseCommand):
    help = 'Assign deliveries for completed payments that have no delivery orders'

    def handle(self, *args, **options):
        # Get completed payments with no delivery orders
        payments = Payment.objects.filter(
            status='completed'
        ).exclude(
            deliveryorder__isnull=False
        )

        for payment in payments:
            try:
                delivery = DeliveryService.assign_delivery(payment.id)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully created delivery order {delivery.id} for payment {payment.payment_id}'
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Failed to create delivery for payment {payment.payment_id}: {str(e)}'
                    )
                ) 
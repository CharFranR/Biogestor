from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Inicializa el loop para guardan en la db la ultima entrada en redis de cada sensor"

    def handle(self, *args, **options):
        from dataSensor.views import save_data_process
        self.stdout.write(self.style.SUCCESS("Starting data saver loop..."))
        # Runs forever; CTRL+C to stop
        try:
            save_data_process()
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("Data saver stopped by user."))
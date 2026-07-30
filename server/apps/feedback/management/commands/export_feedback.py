"""Export pop-up feedback to CSV — the spec's 'arrivi a noi su un foglio'."""
import csv
import sys

from django.core.management.base import BaseCommand

from apps.feedback.models import FeedbackSubmission


class Command(BaseCommand):
    help = "Export feedback submissions as CSV to stdout or a file."

    def add_arguments(self, parser):
        parser.add_argument("--out", help="File path; omit to print to stdout")

    def handle(self, *args, **options):
        out = open(options["out"], "w", newline="") if options.get("out") else sys.stdout
        writer = csv.writer(out)
        writer.writerow(["created_at", "user_email", "page", "text"])
        for f in FeedbackSubmission.objects.select_related("user"):
            writer.writerow([
                f.created_at.isoformat(),
                f.user.email if f.user else "anonimo",
                f.page,
                f.text.replace("\n", " "),
            ])
        if options.get("out"):
            out.close()
            self.stdout.write(self.style.SUCCESS(f"Esportato in {options['out']}"))

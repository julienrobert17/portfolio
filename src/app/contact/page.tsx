import ContactForm from '@/components/contact/contact-form'

export default function ContactPage() {
  return (
    <main className="max-w-xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight mb-2">Contact</h1>
      <p className="text-muted-foreground mb-10">
        Une idée de projet ? Écrivez-moi, je réponds sous 48h.
      </p>
      <ContactForm />
    </main>
  )
}

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="bg-gray-900 text-white">
        {children}
      </body>
    </html>
  );
}
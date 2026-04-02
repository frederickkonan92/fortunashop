'use client'

export default function SupportButton() {
  var link = 'https://wa.me/33664765696?text=Bonjour%20fortunashop%2C%20j%20ai%20besoin%20d%20aide'

  return (
    <a href={link} target="_blank"
       className="fixed bottom-6 left-6 z-50 bg-[#25D366] text-white w-14 h-14 
                  rounded-full flex items-center justify-center shadow-lg 
                  hover:scale-110 transition-transform"
       title="Support WhatsApp">
      <span className="text-2xl">💬</span>
    </a>
  )
}

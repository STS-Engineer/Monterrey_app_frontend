export const HistoricalTimeline = () => {
    const events = [
      {
        year: '1926',
        title: 'First Transatlantic Flight',
        description: 'British aviators Alcock and Brown complete the first non-stop transatlantic flight',
        image: 'https://example.com/transatlantic-flight.jpg',
        color: 'bg-amber-500'
      },
      {
        year: '1969',
        title: 'Moon Landing',
        description: 'Apollo 11 mission lands the first humans on the Moon',
        image: 'https://example.com/moon-landing.jpg',
        color: 'bg-sky-500'
      },
      {
        year: '1991',
        title: 'World Wide Web',
        description: 'Tim Berners-Lee releases the World Wide Web to the public',
        image: 'https://example.com/www.jpg',
        color: 'bg-emerald-500'
      },
      {
        year: '2007',
        title: 'Smartphone Revolution',
        description: 'Apple introduces the first iPhone, changing mobile technology forever',
        image: 'https://example.com/iphone.jpg',
        color: 'bg-purple-500'
      }
    ];
  
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-16 text-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
              Maintenance History
            </span>
          </h2>
  
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 w-1 h-full bg-gradient-to-b from-slate-700 to-slate-600 transform -translate-x-1/2 shadow-xl" />
  
            {events.map((event, index) => (
              <div 
                key={event.year}
                className={`mb-16 flex ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} items-center justify-between`}
              >
                {/* Date circle */}
                <div className={`w-32 h-32 rounded-full ${event.color} flex items-center justify-center 
                  shadow-lg transform hover:scale-110 transition-all duration-300 cursor-pointer
                  border-4 border-white/20 hover:border-white/40 relative group`}>
                  <span className="text-2xl font-bold text-white">{event.year}</span>
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
  
                {/* Content card */}
                <div className="w-1/2 bg-white/5 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-white/10
                  transform transition-all hover:scale-[1.02] hover:bg-white/10 cursor-pointer
                  relative overflow-hidden">
                  {/* Image background */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-20 z-0"
                    style={{ backgroundImage: `url(${event.image})` }}
                  />
                  
                  <h3 className="text-2xl font-bold text-white mb-4 relative z-10">
                    {event.title}
                  </h3>
                  <p className="text-slate-300 leading-relaxed relative z-10">
                    {event.description}
                  </p>
                  
                  {/* Decorative line */}
                  <div className={`absolute top-1/2 ${index % 2 === 0 ? '-right-8' : '-left-8'} 
                    w-8 h-1 ${event.color} transform -translate-y-1/2`} />
                </div>
              </div>
            ))}
          </div>
  
          {/* Interactive background elements */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute w-full h-full bg-[radial-gradient(circle_at_center,#ffffff0a_0%,transparent_70%)]" />
            <div className="absolute top-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    );
  };
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const firstNames = [
  'Maria', 'João', 'Ana', 'Lucas', 'Fernanda', 'Carlos', 'Juliana', 'Pedro',
  'Beatriz', 'Rafael', 'Camila', 'Bruno', 'Larissa', 'Thiago', 'Amanda',
  'Gabriel', 'Isabela', 'Mateus', 'Letícia', 'Diego', 'Patrícia', 'Rodrigo',
  'Vanessa', 'Gustavo', 'Priscila', 'Felipe', 'Daniela', 'André', 'Renata',
  'Marcos', 'Tatiana', 'Vinícius', 'Aline', 'Leonardo', 'Natália', 'Eduardo',
  'Cristina', 'Henrique', 'Simone', 'Fábio', 'Roberta', 'Leandro', 'Cláudia',
  'Ricardo', 'Elaine', 'Marcelo', 'Sandra', 'Rogério', 'Michele', 'Sérgio',
];

const lastInitials = 'A B C D E F G H I J K L M N O P R S T V W'.split(' ');

const cities = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Salvador',
  'Brasília', 'Fortaleza', 'Recife', 'Porto Alegre', 'Goiânia', 'Manaus',
  'Campinas', 'Florianópolis', 'Vitória', 'Belém', 'Natal', 'Santos',
  'Londrina', 'Joinville', 'Ribeirão Preto', 'Uberlândia', 'Sorocaba',
  'Maringá', 'Juiz de Fora', 'Niterói', 'São Luís', 'Maceió', 'Teresina',
];

const timeAgo = () => {
  const mins = Math.floor(Math.random() * 15) + 1;
  return `há ${mins} min`;
};

export function RecentSubscribers() {
  const [notification, setNotification] = useState<{ name: string; city: string; time: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const lastUsedRef = { name: '', city: '' };

  useEffect(() => {
    // Show first after 8-15s, then every 15-30s
    const pickRandom = <T,>(arr: T[], exclude?: T): T => {
      let pick: T;
      do { pick = arr[Math.floor(Math.random() * arr.length)]; } while (pick === exclude);
      return pick;
    };

    const showNotification = () => {
      const first = pickRandom(firstNames, lastUsedRef.name.split(' ')[0]);
      const initial = lastInitials[Math.floor(Math.random() * lastInitials.length)];
      const name = `${first} ${initial}.`;
      const city = pickRandom(cities, lastUsedRef.city);
      lastUsedRef.name = name;
      lastUsedRef.city = city;
      setNotification({ name, city, time: timeAgo() });
      setVisible(true);

      // Hide after 4s
      setTimeout(() => setVisible(false), 4000);
    };

    const initialDelay = setTimeout(showNotification, 8000 + Math.random() * 7000);

    const interval = setInterval(() => {
      showNotification();
    }, 18000 + Math.random() * 12000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && notification && (
        <motion.div
          className="fixed bottom-20 left-4 z-50 md:bottom-6 md:left-6 max-w-xs"
          initial={{ opacity: 0, x: -80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -80, scale: 0.9 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-lg backdrop-blur-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {notification.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Assinou o plano anual • {notification.city} • {notification.time}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

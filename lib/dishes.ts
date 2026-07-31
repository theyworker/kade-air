export type Dish = {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  c: string;
  /** 256px icon — menus, cards, in-world props */
  low: string;
  /** 1254px icon — the delivered reveal only */
  high: string;
};

// Every dish ships two renders of the same icon; `slug` names the pair in /public/food.
function dish(id: string, slug: string, name: string, emoji: string, blurb: string, c: string): Dish {
  return { id, name, emoji, blurb, c, low: `/food/${slug}-low-res.webp`, high: `/food/${slug}-high-res.webp` };
}

export const DISHES: Dish[] = [
  dish('kottu', 'chicken-kottu', 'Kottu', '🥘', 'Loud enough for the whole neighbourhood', '#ffd9a8'),
  dish('biryani', 'chicken-biryani', 'Chicken Biryani', '🍗', 'Wedding quality. No invitation needed', '#ffe9a8'),
  dish('hoppers', 'egg-hoppers', 'Egg Hoppers', '🍳', 'Crispy edges, runny middle. Perfect!', '#fff3d0'),
  dish('string', 'string-hoppers-chicken-curry-sambol', 'String Hoppers & Dhal', '🍜', 'Nobody stops at ten', '#ffe0d0'),
  dish('watalappan', 'full-watalappan', 'A Whole Watalappan', '🍮', "Sharing is optional. Regret isn't", '#e8d5c0'),
  dish('isso', 'isso-wade', 'Isso Wade', '🦐', 'Beach vibes. Extra crunch', '#ffd0c0'),
  dish('pizza', 'large-pizza', 'Full Pizza', '🍕', 'Eight slices. One sitting', '#ffdfc0'),
  dish('sushi', 'tuna-avocado-hosomaki-salmon-nigiri', 'Sushi Stack', '🍣', 'For your fancy machan', '#d8f0e0'),
  dish('cake', 'full-birthday-cake', 'Birthday Cake', '🎂', 'Instant celebration mode', '#ffd8e8'),
  dish('boba', 'bubble-tea', 'Bubble Tea', '🧋', 'Worth the jaw workout', '#e0d8f8'),
  dish('pittu', 'pittu-with-kiri-hodi', 'Pittu', '🥥', 'Cylinder of happiness', '#fff3d0'),
  dish('parippu', 'pol-roti', 'Pol Roti', '🍛', 'Like a hug from Amma', '#ffe9a8'),
  dish('murukku', 'murukku', 'Murukku', '🥨', 'One becomes twenty', '#ffd9a8'),
  dish('kiribath', 'kiribath-lunu-miris', 'Kiribath', '🍚', 'Avurudu mood. All year', '#e7f4f0'),
  dish('polsambol', 'roast-paan-pol-sambol', 'Pol Sambol', '🌶️', 'The real main character', '#ffd0c0'),
  dish('lamprais', 'chicken-lamprais', 'Lamprais', '🍱', 'Wrapped like a present', '#d8f0e0'),
  dish('ambulthiyal', 'ambul-thiyal', 'Ambul Thiyal', '🐟', 'Pure southern energy', '#cdeafc'),
  dish('chickencurry', 'chicken-curry', 'Chicken Curry', '🍲', "Amma's recipe. No questions asked", '#ffdfc0'),
  dish('rolls', 'chinese-rolls', 'Chinese Rolls', '🌯', 'Not Chinese. Still legendary', '#ffe0d0'),
  dish('cutlets', 'fish-cutlets', 'Fish Cutlets', '🧆', 'Always the first to disappear', '#e8d5c0'),
  dish('patties', 'patties', 'Patties', '🥟', 'Pocket-sized happiness', '#ffe9a8'),
  dish('maalupaan', 'maalu-paan', 'Maalu Paan', '🥐', "Every bakery's MVP", '#ffd9a8'),
  dish('kimbula', 'kimbula-banis', 'Kimbula Banis', '🍞', 'Looks dangerous. Tastes amazing', '#fff3d0'),
  dish('faluda', 'faluda', 'Faluda', '🥤', 'The prettiest sugar rush', '#ffd8e8'),
  dish('curd', 'curd-and-treacle', 'Curd & Treacle', '🍯', 'Simple. Classic. Perfect', '#ffe9a8'),
  dish('achcharu', 'mango-achcharu', 'Achcharu', '🥭', 'Painfully worth it', '#ffdfc0'),
  dish('kokis', 'kokis', 'Kokis', '🌼', 'Crunch louder, smile bigger', '#fff3d0'),
  dish('kavum', 'kavum', 'Kavum', '🍩', 'Sweet enough to forgive anyone', '#e8d5c0'),
  dish('thambili', 'thambili', 'Thambili', '🍈', "Sri Lanka's original energy drink", '#d8f0e0'),
  dish('eggroti', 'egg-roti', 'Egg Roti', '🫓', 'Simple never tasted this good', '#ffe0d0'),
];

export function findDish(id: string): Dish {
  return DISHES.find((d) => d.id === id) || DISHES[0];
}

// The five bobbing icons on the landing screen. The design shuffles these per
// render; here the pick is fixed so the server and client agree on the markup.
export const floatArt: Dish[] = ['kottu', 'hoppers', 'watalappan', 'pizza', 'boba'].map(findDish);

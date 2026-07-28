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
  return { id, name, emoji, blurb, c, low: `/food/${slug}-low-res.png`, high: `/food/${slug}-high-res.png` };
}

export const DISHES: Dish[] = [
  dish('kottu', 'chicken-kottu', 'Kottu', '🥘', 'chop-chop-chop — you can hear it, no?', '#ffd9a8'),
  dish('biryani', 'chicken-biryani', 'Chicken Biryani', '🍗', 'wedding-grade. aunty approved.', '#ffe9a8'),
  dish('hoppers', 'egg-hoppers', 'Egg Hoppers', '🍳', 'crispy edges, runny middle. perfect.', '#fff3d0'),
  dish('string', 'string-hoppers-chicken-curry-sambol', 'String Hoppers & Dhal', '🍜', '20 minimum, or why even.', '#ffe0d0'),
  dish('watalappan', 'full-watalappan', 'A Whole Watalappan', '🍮', 'the WHOLE thing. no sharing.', '#e8d5c0'),
  dish('isso', 'isso-wade', 'Isso Wade', '🦐', 'Galle Face classic, extra crunch.', '#ffd0c0'),
  dish('pizza', 'large-pizza', 'Full Pizza', '🍕', 'all 8 slices. zero guilt.', '#ffdfc0'),
  dish('sushi', 'tuna-avocado-hosomaki-salmon-nigiri', 'Sushi Stack', '🍣', 'fancy machan energy.', '#d8f0e0'),
  dish('cake', 'full-birthday-cake', 'Birthday Cake', '🎂', "it's not even your birthday.", '#ffd8e8'),
  dish('boba', 'bubble-tea', 'Bubble Tea', '🧋', '50% sugar, 100% fake.', '#e0d8f8'),
  dish('pittu', 'pittu-with-kiri-hodi', 'Pittu', '🥥', 'steamed logs of joy. coconut mandatory.', '#fff3d0'),
  dish('parippu', 'pol-roti', 'Pol Roti', '🍛', 'coconut roti. the national hug.', '#ffe9a8'),
  dish('murukku', 'murukku', 'Murukku', '🥨', 'crunchy spirals. impossible to stop.', '#ffd9a8'),
  dish('kiribath', 'kiribath-lunu-miris', 'Kiribath', '🍚', 'new year energy, any day.', '#e7f4f0'),
  dish('polsambol', 'roast-paan-pol-sambol', 'Pol Sambol', '🌶️', 'fire + coconut = perfection.', '#ffd0c0'),
  dish('lamprais', 'chicken-lamprais', 'Lamprais', '🍱', 'banana-leaf parcel. Dutch approved.', '#d8f0e0'),
  dish('ambulthiyal', 'ambul-thiyal', 'Ambul Thiyal', '🐟', 'sour fish, big flavour.', '#cdeafc'),
  dish('chickencurry', 'chicken-curry', 'Chicken Curry', '🍲', "amma's recipe. non-negotiable.", '#ffdfc0'),
  dish('rolls', 'chinese-rolls', 'Chinese Rolls', '🌯', 'not Chinese. still elite.', '#ffe0d0'),
  dish('cutlets', 'fish-cutlets', 'Fish Cutlets', '🧆', 'party legend. gone in seconds.', '#e8d5c0'),
  dish('patties', 'patties', 'Patties', '🥟', 'crispy half-moons of happiness.', '#ffe9a8'),
  dish('maalupaan', 'maalu-paan', 'Maalu Paan', '🥐', 'bakery-bus classic.', '#ffd9a8'),
  dish('kimbula', 'kimbula-banis', 'Kimbula Banis', '🍞', 'crocodile bun. sugar crystals. bite it.', '#fff3d0'),
  dish('faluda', 'faluda', 'Faluda', '🥤', 'pink, cold, dramatic.', '#ffd8e8'),
  dish('curd', 'curd-and-treacle', 'Curd & Treacle', '🍯', 'clay pot. kithul. heaven.', '#ffe9a8'),
  dish('achcharu', 'mango-achcharu', 'Achcharu', '🥭', 'sour, spicy, eyes watering. worth it.', '#ffdfc0'),
  dish('kokis', 'kokis', 'Kokis', '🌼', 'crispy avurudu flowers.', '#fff3d0'),
  dish('kavum', 'kavum', 'Kavum', '🍩', 'oil cake royalty.', '#e8d5c0'),
  dish('thambili', 'thambili', 'Thambili', '🍈', 'roadside king coconut. hydration deluxe.', '#d8f0e0'),
  dish('eggroti', 'egg-roti', 'Egg Roti', '🫓', "kottu's chill cousin.", '#ffe0d0'),
];

export function findDish(id: string): Dish {
  return DISHES.find((d) => d.id === id) || DISHES[0];
}

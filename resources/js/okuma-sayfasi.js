import { okumayiBaslat } from './okuma';
import { bildir, dosyaAlaniBagla } from './ortak';

const dosyalariEkle = okumayiBaslat(bildir);
dosyaAlaniBagla('okuma-birak', 'okuma-dosyalar', dosyalariEkle);

export interface Persona {
  ini: string;
  nombre: string;
  rol?: string;
}

export interface Area {
  id: string;
  nombre: string;
  jefatura: string;
  personas: Persona[];
}

export const equipo: Area[] = [
  {
    id: 'administracion',
    nombre: 'Administración',
    jefatura: 'JOSÉ BENITO SOTIL BINDELS',
    personas: [
      { ini: 'JC', nombre: 'Jackeline Coral' },
      { ini: 'NS', nombre: 'Nataly Salazar Chuquihuanca' },
    ],
  },
  {
    id: 'centro-control',
    nombre: 'Centro de control',
    jefatura: 'JOSÉ BENITO SOTIL BINDELS',
    personas: [
      { ini: 'FY', nombre: 'Filiberto Yataco Neyra' },
      { ini: 'RC', nombre: 'Roberto Carlos Ponce Canchihuaman' },
      { ini: 'JA', nombre: 'Jose Antonio Millares Garcia' },
      { ini: 'JM', nombre: 'Jose Manuel Ochoa Velasquez' },
      { ini: 'JC', nombre: 'Juan Carlos Paredes Martinez' },
      { ini: 'JC', nombre: 'Juan Carlos Perea Rojas' },
      { ini: 'RC', nombre: 'Roberto Chocce Ore' },
      { ini: 'SM', nombre: 'Sergio Marcelo Tangoa Apagueño' },
    ],
  },
  {
    id: 'comercial',
    nombre: 'Comercial',
    jefatura: 'Mike Klaus Fuchs Lopez',
    personas: [],
  },
  {
    id: 'contabilidad',
    nombre: 'Contabilidad',
    jefatura: 'José Benito Sotil Bindels',
    personas: [{ ini: 'MN', nombre: 'Maily Nacimiento' }],
  },
  {
    id: 'convexia',
    nombre: 'Convexia',
    jefatura: 'Lorena Castro',
    personas: [{ ini: 'LC', nombre: 'Lorena Castro', rol: 'Gerente General' }],
  },
  {
    id: 'estacionamiento',
    nombre: 'Estacionamiento',
    jefatura: 'César Dionisio Deza Silva',
    personas: [
      { ini: 'AR', nombre: 'Anthony Rafael Obispo Quiroz' },
      { ini: 'CD', nombre: 'César Dionisio Deza Silva', rol: 'Jefe' },
    ],
  },
  {
    id: 'finanzas',
    nombre: 'Finanzas',
    jefatura: 'José Benito Sotil Bindels',
    personas: [{ ini: 'CD', nombre: 'Carlos Daniel Uehara Yagui' }],
  },
  {
    id: 'gerencia-general',
    nombre: 'Gerencia General',
    jefatura: 'José Benito Sotil Bindels',
    personas: [{ ini: 'JB', nombre: 'José Benito Sotil Bindels', rol: 'Gerente General' }],
  },
  {
    id: 'legal',
    nombre: 'Legal',
    jefatura: 'José Benito Sotil Bindels',
    personas: [
      { ini: 'AB', nombre: 'Andrea Berrospi' },
      { ini: 'GS', nombre: 'Gabriela Silva' },
    ],
  },
  {
    id: 'limpieza',
    nombre: 'Limpieza',
    jefatura: 'Roberto Carlos Ponce Canchihuaman',
    personas: [
      { ini: 'CG', nombre: 'Cecilia Gutierrez Pomahuacre' },
      { ini: 'GB', nombre: 'Graciela Betty Flores Rojas' },
      { ini: 'HV', nombre: 'Hermelinda Vergara Orizano' },
      { ini: 'JR', nombre: 'Janeth Ruth Echevarria Guevara' },
      { ini: 'JJ', nombre: 'Jessie Johana Huamani Castañeda' },
      { ini: 'KM', nombre: 'Karla Mercedes Lopez Huaman' },
      { ini: 'KS', nombre: 'Karla Stefany Gutierrez Villanueva' },
      { ini: 'LA', nombre: 'Luis Alberto Castro Ricra' },
      { ini: 'MA', nombre: 'Maria Adeli Tantas Vasquez' },
      { ini: 'ML', nombre: 'Marianela Llurandi Papa Bardales' },
    ],
  },
  {
    id: 'mantenimiento',
    nombre: 'Mantenimiento',
    jefatura: 'José Benito Sotil Bindels',
    personas: [
      { ini: 'ER', nombre: 'Elvis Rosendo Collantes Cullcush' },
      { ini: 'EF', nombre: 'Ermes Flavier Ninanya Lizarrraga' },
      { ini: 'HG', nombre: 'Hernan Gutierrez Gaspar' },
      { ini: 'JS', nombre: 'Jesús Sudario Nicasio' },
      { ini: 'LJ', nombre: 'Lenyn John Bejarano Macedo' },
    ],
  },
  {
    id: 'marketing',
    nombre: 'Marketing',
    jefatura: 'Leilah Alexandra Ocampo Pajes',
    personas: [
      { ini: 'AM', nombre: 'Andrea Micaela Marin Lajera' },
      { ini: 'JC', nombre: 'Julio Cesar Pereyra Julca' },
      { ini: 'LA', nombre: 'Leilah Alexandra Ocampo Pajes', rol: 'Jefe' },
      { ini: 'MK', nombre: 'Mike Klaus Fuchs Lopez' },
    ],
  },
  {
    id: 'operaciones',
    nombre: 'Operaciones',
    jefatura: 'Mario Eduardo Peralta Saavedra',
    personas: [
      { ini: 'AN', nombre: 'Adriana Nicole Vallejos Yauri' },
      { ini: 'AG', nombre: 'Alex Gustavo Rodriguez Rivas' },
      { ini: 'AE', nombre: 'Allyson Elizabeth Astocaza Ore', rol: 'Delivery' },
      { ini: 'AM', nombre: 'Ana María Tataje Con' },
      { ini: 'AM', nombre: 'Ana Mishell Elise Perez Macavilca' },
      { ini: 'BN', nombre: 'Bill Nike Maguiña Mendoza', rol: 'Delivery' },
      { ini: 'CY', nombre: 'Camila Yamileth Quicaño Palacios' },
      { ini: 'CE', nombre: 'Carlos Esteban Paez Romero' },
      { ini: 'CA', nombre: 'Claudio Andres Julian Ancco' },
      { ini: 'DR', nombre: 'Dahayan Rubi Rodriguez Ayala' },
      { ini: 'DH', nombre: 'Davis Hemilton Vargas Peña' },
      { ini: 'GS', nombre: 'Geraldine Stephany Espinoza Pingo' },
      { ini: 'GI', nombre: 'Gloria Ines Flores Rojas' },
      { ini: 'GP', nombre: 'Gloria Patricia Bacca Chavez' },
      { ini: 'GN', nombre: 'Gonzalo Nicolás Ortiz Zevallos' },
      { ini: 'JY', nombre: 'Jeremy Yandell Palacios Cueva', rol: 'Delivery' },
      { ini: 'JR', nombre: 'Julio Rodrigo Villanueva Bocanegra', rol: 'Delivery' },
      { ini: 'LM', nombre: 'Lizbet Milagros Benique Argumedo' },
      { ini: 'LM', nombre: 'Lizbeth Maria Aponte Peceros' },
      { ini: 'ME', nombre: 'Mario Eduardo Peralta Saavedra', rol: 'Jefe' },
      { ini: 'ME', nombre: 'Matias Emmanuell Chappa Valles', rol: 'Delivery' },
      { ini: 'MR', nombre: 'Moises Reiter Ocaña', rol: 'Sonidista' },
      { ini: 'NK', nombre: 'Nadesha Karimsui Perez Castro', rol: 'Anfitriona' },
      { ini: 'NS', nombre: 'Nazareth Samara Gallgher García' },
    ],
  },
  {
    id: 'operaciones-cavas',
    nombre: 'Operaciones Cavas',
    jefatura: 'Katherine Tafur',
    personas: [
      { ini: 'KT', nombre: 'Katherine Tafur', rol: 'Jefe de operaciones' },
      { ini: 'KG', nombre: 'Karem Gutiérrez', rol: 'Responsable de caja chica' },
      { ini: 'PS', nombre: 'Pedro Solana', rol: 'Responsable de caja chica' },
      { ini: 'VZ', nombre: 'Valerie Zúñiga', rol: 'Responsable de caja chica' },
    ],
  },
  {
    id: 'rrhh',
    nombre: 'RR. HH.',
    jefatura: 'Brenda Karen Espinoza Ramos',
    personas: [{ ini: 'BK', nombre: 'Brenda Karen Espinoza Ramos' }],
  },
  {
    id: 'sistemas',
    nombre: 'Sistemas',
    jefatura: 'José Benito Sotil Bindels',
    personas: [{ ini: 'GI', nombre: 'German Ivan Huaytalla Aquino' }],
  },
];

export const totalAreas = equipo.length;

export const totalPersonas = equipo.reduce((n, a) => n + a.personas.length, 0);

/**
 * Nombre corto para mostrar: SOLO 1 nombre + 1 apellido.
 * Regla: primer token + penúltimo token (apellido paterno).
 * - 1 token → se devuelve tal cual (con capitalización normalizada).
 * - 2 tokens → ambos ("Katherine Tafur").
 * - 3+ tokens → primero + penúltimo ("Roberto Carlos Ponce Canchihuaman"
 *   → "Roberto Ponce"; "Nataly Salazar Chuquihuanca" → "Nataly Salazar").
 * La capitalización se normaliza a tipo título ("JOSÉ BENITO SOTIL BINDELS"
 * → "José Sotil") para que jefaturas en mayúsculas y nombres mixtos
 * compartan el mismo criterio visual.
 */
export function nombreCorto(nombreCompleto: string): string {
  const cap = (s: string): string =>
    s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const parts = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts.map(cap).join(' ');
  if (parts.length === 2) return parts.map(cap).join(' ');
  return `${cap(parts[0])} ${cap(parts[parts.length - 2])}`;
}

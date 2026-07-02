import supabase from '../lib/supabase';
import RoomRepository from '../repositories/RoomRepository';
import GuestRepository from '../repositories/GuestRepository';
import ReservationRepository from '../repositories/ReservationRepository';

const seedDatabase = async () => {
  try {
    console.log('🌱 Creando datos de prueba...');

    const roomRepo = new RoomRepository();
    const guestRepo = new GuestRepository();
    const reservationRepo = new ReservationRepository();

    // Crear habitaciones de prueba
    const rooms = [
      { number: '101', type: 'single', price: 800, capacity: 1, status: 'available' },
      { number: '102', type: 'single', price: 800, capacity: 1, status: 'available' },
      { number: '103', type: 'double', price: 1200, capacity: 2, status: 'available' },
      { number: '104', type: 'double', price: 1200, capacity: 2, status: 'available' },
      { number: '105', type: 'suite', price: 2000, capacity: 3, status: 'available' },
      { number: '106', type: 'suite', price: 2000, capacity: 3, status: 'available' },
      { number: '107', type: 'family', price: 2500, capacity: 4, status: 'available' },
      { number: '108', type: 'family', price: 2500, capacity: 4, status: 'available' },
    ];

    for (const room of rooms) {
      await roomRepo.create(room);
    }

    // Crear huéspedes de prueba
    const guests = [
      { full_name: 'Juan Pérez', email: 'juan@email.com', phone: '4491234567', nationality: 'Mexicana' },
      { full_name: 'María García', email: 'maria@email.com', phone: '4492345678', nationality: 'Mexicana' },
      { full_name: 'Carlos López', email: 'carlos@email.com', phone: '4493456789', nationality: 'Mexicana' },
      { full_name: 'Ana Martínez', email: 'ana@email.com', phone: '4494567890', nationality: 'Española' },
      { full_name: 'Pedro Sánchez', email: 'pedro@email.com', phone: '4495678901', nationality: 'Argentina' },
    ];

    const createdGuests = [];
    for (const guest of guests) {
      const created = await guestRepo.create(guest);
      createdGuests.push(created);
    }

    // Crear reservaciones de prueba
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const reservations = [
      {
        guest_id: createdGuests[0].id,
        room_id: (await roomRepo.findBy('number', '101'))[0]?.id,
        check_in: today.toISOString().split('T')[0],
        check_out: tomorrow.toISOString().split('T')[0],
        total_amount: 800,
        guests_count: 1,
        status: 'active',
      },
      {
        guest_id: createdGuests[1].id,
        room_id: (await roomRepo.findBy('number', '103'))[0]?.id,
        check_in: today.toISOString().split('T')[0],
        check_out: nextWeek.toISOString().split('T')[0],
        total_amount: 1200,
        guests_count: 2,
        status: 'active',
      },
    ];

    for (const reservation of reservations) {
      if (reservation.room_id) {
        await reservationRepo.create(reservation);
      }
    }

    console.log('✅ Datos de prueba creados correctamente');
  } catch (error) {
    console.error('❌ Error al crear datos de prueba:', error);
  }
};

export default seedDatabase;
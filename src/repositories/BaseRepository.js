import supabase from '../lib/supabase';

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.supabase = supabase;
  }

  async findAll() {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error en findAll de ${this.tableName}:`, error);
      return [];
    }
  }

  async findById(id) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error en findById de ${this.tableName}:`, error);
      return null;
    }
  }

  async create(item) {
    console.log('Creando en', this.tableName, item);
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(item)
        .select()
        .single();
      
      if (error) {
        console.error('Error en create:', error);
        throw error;
      }
      console.log('Creado:', data);
      return data;
    } catch (error) {
      console.error(`Error en create de ${this.tableName}:`, error);
      throw error;
    }
  }

  async update(id, item) {
    console.log('Actualizando en', this.tableName, id, item);
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(item)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error en update:', error);
        throw error;
      }
      console.log('Actualizado:', data);
      return data;
    } catch (error) {
      console.error(`Error en update de ${this.tableName}:`, error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error en delete de ${this.tableName}:`, error);
      throw error;
    }
  }

  async findBy(field, value) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq(field, value);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error en findBy de ${this.tableName}:`, error);
      return [];
    }
  }

  // Suscripción en tiempo real
  subscribe(callback, event = '*') {
    return this.supabase
      .channel(`${this.tableName}-changes`)
      .on(
        'postgres_changes',
        {
          event: event,
          schema: 'public',
          table: this.tableName,
        },
        callback
      )
      .subscribe();
  }
}

export default BaseRepository;
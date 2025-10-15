import { NextResponse } from 'next/server';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createSupabaseServerAdminClient();
    
    // Query the ehs_ebv.profiles table using the admin client to bypass RLS
    const { data: profiles, error } = await supabase
      .schema('ehs_ebv').from('profiles')
      .select(`
        id,
        email,
        ehs_id,
        first_name,
        last_name,
        role,
        updated_at,
        created_at,
        created_by,
        updated_by,
        password,
        capacity
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: error.message },
        { status: 500 }
      );
    }

    // Transform the data to include all fields
    const transformedProfiles = profiles.map(profile => ({
      id: profile.id,
      email: profile.email,
      ehs_id: profile.ehs_id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      full_name: profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : profile.first_name || profile.last_name || 'N/A',
      role: profile.role,
      updated_at: profile.updated_at,
      created_at: profile.created_at,
      created_by: profile.created_by,
      updated_by: profile.updated_by,
      password: profile.password,
      capacity: profile.capacity,
    }));

    return NextResponse.json({
      profiles: transformedProfiles,
      total: profiles.length
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

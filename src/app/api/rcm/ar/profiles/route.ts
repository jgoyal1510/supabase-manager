import { NextResponse } from 'next/server';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createSupabaseServerAdminClient();
    
    // Query the ehs_ar.profiles table using the admin client to bypass RLS
    const { data: profiles, error } = await supabase
      .schema('ehs_ar')
      .from('profiles')
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

export async function POST() {
  try {
    const supabase = createSupabaseServerAdminClient();
    
    // First, get all existing users from auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json(
        { error: 'Failed to fetch auth users', details: authError.message },
        { status: 500 }
      );
    }

    // Test users data from the markdown file with expected emails
    const testUsersData = [
      // Acme HealthCare users
      { name: 'Aarav Sharma', email: 'aarav.sharma@acme.com', role: 'manager', domain: 'acme.com' },
      { name: 'Sanya Kapoor', email: 'sanya.kapoor@acme.com', role: 'assistant_manager', domain: 'acme.com' },
      { name: 'Rahul Mehta', email: 'rahul.mehta@acme.com', role: 'teamLead', domain: 'acme.com' },
      { name: 'Priya Patel', email: 'priya.patel@acme.com', role: 'qa', domain: 'acme.com' },
      { name: 'Vikram Rao', email: 'vikram.rao@acme.com', role: 'qa', domain: 'acme.com' },
      { name: 'Neha Singh', email: 'neha.singh@acme.com', role: 'user', domain: 'acme.com' },
      { name: 'Ishaan Verma', email: 'ishaan.verma@acme.com', role: 'user', domain: 'acme.com' },
      
      // Dollar HealthCare users
      { name: 'Anjali Desai', email: 'anjali.desai@dollar.care', role: 'manager', domain: 'dollar.care' },
      { name: 'Karan Gupta', email: 'karan.gupta@dollar.care', role: 'assistant_manager', domain: 'dollar.care' },
      { name: 'Ritu Nair', email: 'ritu.nair@dollar.care', role: 'teamLead', domain: 'dollar.care' },
      { name: 'Rohit Iyer', email: 'rohit.iyer@dollar.care', role: 'qa', domain: 'dollar.care' },
      { name: 'Meera Joshi', email: 'meera.joshi@dollar.care', role: 'qa', domain: 'dollar.care' },
      { name: 'Sanjay Kulkarni', email: 'sanjay.kulkarni@dollar.care', role: 'user', domain: 'dollar.care' },
      { name: 'Dia Mahajan', email: 'dia.mahajan@dollar.care', role: 'user', domain: 'dollar.care' },
    ];

    const defaultValues = {
      created_by: '8a678239-a165-4dab-ad47-c71d4b26c38e',
      updated_by: '8a678239-a165-4dab-ad47-c71d4b26c38e',
      password_hash: '$2b$10$0HtIv2c8sN3C5Kkx8ALrCOErm9GJrHgHhFzJFZNvXPIcQLxE91UMO',
      capacity: 50,
    };

    const results = [];
    const errors = [];
    let acmeCounter = 1;
    let dollarCounter = 1;

    // Process each test user
    for (const testUser of testUsersData) {
      try {
        // Find matching auth user by email
        const authUser = authUsers.users.find(user => user.email === testUser.email);
        
        if (!authUser) {
          errors.push({
            email: testUser.email,
            error: `Auth user not found for email: ${testUser.email}`
          });
          continue;
        }

        // Generate EHS ID based on domain
        const ehsId = testUser.domain === 'acme.com' 
          ? `ACME${String(acmeCounter).padStart(3, '0')}`
          : `DOLLAR${String(dollarCounter).padStart(3, '0')}`;

        // Increment counters
        if (testUser.domain === 'acme.com') {
          acmeCounter++;
        } else {
          dollarCounter++;
        }

        // Split name into first and last name
        const nameParts = testUser.name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        // Insert into profiles table
        const { data: profile, error: profileError } = await supabase
          .schema('ehs_ar')
          .from('profiles')
          .insert({
            id: authUser.id,
            email: testUser.email,
            ehs_id: ehsId,
            first_name: firstName,
            last_name: lastName,
            role: testUser.role,
            password: defaultValues.password_hash,
            capacity: defaultValues.capacity,
            created_by: defaultValues.created_by,
            updated_by: defaultValues.updated_by,
          })
          .select()
          .single();

        if (profileError) {
          errors.push({
            email: testUser.email,
            error: `Profile creation failed: ${profileError.message}`
          });
        } else {
          results.push({
            email: testUser.email,
            name: testUser.name,
            ehs_id: ehsId,
            role: testUser.role,
            auth_id: authUser.id,
            success: true
          });
        }
      } catch (err) {
        errors.push({
          email: testUser.email,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      failed: errors.length,
      total: testUsersData.length,
      results,
      errors,
      message: `Successfully created ${results.length} out of ${testUsersData.length} profiles`
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT() {
  try {
    const supabase = createSupabaseServerAdminClient();
    
    const newPasswordHash = '$2b$10$0HtIv2c8sN3C5Kkx8ALrCOErm9GJrHgHhFzJFZNvXPIcQLxE91UMO';
    
    // Update all profiles in ehs_ar.profiles table with the new password hash
    const { data: updatedProfiles, error: updateError } = await supabase
      .schema('ehs_ar')
      .from('profiles')
      .update({ 
        password: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000') // This ensures we update all records
      .select('id, email, ehs_id, first_name, last_name, role');
    
    if (updateError) {
      console.error('Error updating profiles:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profiles', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: updatedProfiles.length,
      message: `Successfully updated ${updatedProfiles.length} profiles with new password hash`,
      profiles: updatedProfiles
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

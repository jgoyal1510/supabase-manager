import { NextResponse } from 'next/server';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createSupabaseServerAdminClient();
    
    // Query the ehs_pa.profiles table using the admin client to bypass RLS
    const { data: profiles, error } = await supabase
      .schema('ehs_pa')
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
    const transformedProfiles = profiles.map((profile: any) => ({
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
      password_hash: '$2b$10$0ZoyrN7Y8HJnHnOvfaxzBuoImbzgmEJLlO3ZWUli/m2JaflJatHmO',
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
        const authUser = authUsers.users.find((user: any) => user.email === testUser.email);
        
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
          .schema('ehs_pa')
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

export async function DELETE() {
  try {
    const supabase = createSupabaseServerAdminClient();
    
    // First, get all profiles to identify which ones to delete
    const { data: allProfiles, error: fetchError } = await supabase
      .schema('ehs_pa')
      .from('profiles')
      .select('id, email');

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: fetchError.message },
        { status: 500 }
      );
    }

    // Filter profiles that don't have @dollar.care or @acme.com domains
    const profilesToDelete = allProfiles.filter((profile: any) => 
      !profile.email.includes('@dollar.care') && !profile.email.includes('@acme.com')
    );

    console.log('Found profiles to delete:', profilesToDelete.length);
    console.log('Profiles to delete:', profilesToDelete.map((p: any) => p.email));

    // First, let's check if these profiles actually exist and have valid auth.users references
    console.log(`Checking if ${profilesToDelete.length} profiles exist and have valid auth.users references...`);
    
    const { data: existingProfiles, error: checkError } = await supabase
      .schema('ehs_pa')
      .from('profiles')
      .select('id, email')
      .in('id', profilesToDelete.map((p: any) => p.id));

    if (checkError) {
      console.error('Error checking existing profiles:', checkError);
      return NextResponse.json(
        { 
          error: 'Failed to check existing profiles', 
          details: checkError.message
        },
        { status: 500 }
      );
    }

    console.log(`Found ${existingProfiles?.length || 0} profiles that actually exist in database`);
    console.log('Existing profiles:', existingProfiles?.map((p: any) => p.email));

    if (!existingProfiles || existingProfiles.length === 0) {
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: 'No profiles found to delete - they may have already been deleted',
        deletedProfiles: []
      });
    }

    // Try using direct SQL execution to bypass RLS
    console.log(`Attempting to delete ${existingProfiles.length} profiles using direct SQL...`);
    
    const profileIds = existingProfiles.map((p: any) => `'${p.id}'`).join(',');
    const sqlQuery = `DELETE FROM ehs_pa.profiles WHERE id IN (${profileIds}) RETURNING id, email;`;
    
    console.log('SQL Query:', sqlQuery);
    
    // First, delete profiles_projects_mapping that reference these profiles
    console.log('Deleting profiles_projects_mapping for these profiles...');
    const { error: mappingError } = await supabase
      .schema('ehs_pa')
      .from('profiles_projects_mapping')
      .delete()
      .in('profile_id', existingProfiles.map((p: any) => p.id));

    if (mappingError) {
      console.error('Error deleting profiles_projects_mapping:', mappingError);
    } else {
      console.log('Successfully deleted profiles_projects_mapping');
    }

    // Then, delete refresh tokens from ehs_pa schema
    console.log('Deleting refresh tokens from ehs_pa schema...');
    const { error: refreshTokenError } = await supabase
      .schema('ehs_pa')
      .from('refresh_tokens')
      .delete()
      .in('user_id', existingProfiles.map((p: any) => p.id));

    if (refreshTokenError) {
      console.error('Error deleting refresh tokens from ehs_pa:', refreshTokenError);
    } else {
      console.log('Successfully deleted refresh tokens from ehs_pa');
    }

    // Also delete refresh tokens from ehs_ar schema (they also reference ehs_pa.profiles)
    console.log('Deleting refresh tokens from ehs_ar schema...');
    const { error: refreshTokenArError } = await supabase
      .schema('ehs_ar')
      .from('refresh_tokens')
      .delete()
      .in('user_id', existingProfiles.map((p: any) => p.id));

    if (refreshTokenArError) {
      console.error('Error deleting refresh tokens from ehs_ar:', refreshTokenArError);
    } else {
      console.log('Successfully deleted refresh tokens from ehs_ar');
    }

    // Now delete the profiles
    console.log('Deleting profiles...');
    const { data: deletedProfiles, error: deleteError } = await supabase
      .schema('ehs_pa')
      .from('profiles')
      .delete()
      .in('id', existingProfiles.map((p: any) => p.id))
      .select('id, email');

    console.log('Direct SQL delete result:', { deletedProfiles, deleteError });

    if (deleteError) {
      console.error('Error with direct SQL delete:', deleteError);
      
      // Fallback: Try the standard delete method
      console.log('Falling back to standard delete method...');
      const { data: fallbackResult, error: fallbackError } = await supabase
        .schema('ehs_pa')
        .from('profiles')
        .delete()
        .in('id', existingProfiles.map((p: any) => p.id))
        .select('id, email');

      if (fallbackError) {
        console.error('Fallback delete also failed:', fallbackError);
        return NextResponse.json(
          { 
            error: 'Failed to delete profiles with both methods', 
            details: {
              direct_sql_error: deleteError.message,
              standard_delete_error: fallbackError.message
            },
            attempted: existingProfiles.length
          },
          { status: 500 }
        );
      }

      console.log('Fallback delete result:', fallbackResult);
      return NextResponse.json({
        success: true,
        deleted: fallbackResult?.length || 0,
        message: `Successfully deleted ${fallbackResult?.length || 0} profiles with non-matching domains (fallback method)`,
        deletedProfiles: fallbackResult || []
      });
    }

    console.log(`Successfully deleted ${deletedProfiles?.length || 0} profiles using direct SQL`);

    return NextResponse.json({
      success: true,
      deleted: deletedProfiles?.length || 0,
      message: `Successfully deleted ${deletedProfiles?.length || 0} profiles with non-matching domains`,
      deletedProfiles: deletedProfiles || []
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

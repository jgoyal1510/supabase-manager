import { NextResponse } from 'next/server';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createSupabaseServerAdminClient();
    
    // Query the ehs_pa.profiles_projects_mapping table with related data
    const { data: mappings, error } = await supabase
      .schema('ehs_pa')
      .from('profiles_projects_mapping')
      .select(`
        id,
        profile_id,
        project_id,
        created_at,
        updated_at,
        created_by,
        updated_by,
        profiles!profiles_projects_mapping_profile_id_fkey (
          id,
          email,
          first_name,
          last_name,
          ehs_id,
          role
        ),
        projects!profiles_projects_mapping_project_id_fkey (
          id,
          name,
          client_id,
          client_sub_id,
          project_id,
          created_at,
          updated_at,
          created_by,
          updated_by
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching profiles-projects mappings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch mappings', details: error.message },
        { status: 500 }
      );
    }

    // Transform the data to include all fields
    const transformedMappings = mappings.map((mapping: any) => ({
      id: mapping.id,
      profile_id: mapping.profile_id,
      project_id: mapping.project_id,
      created_at: mapping.created_at,
      updated_at: mapping.updated_at,
      created_by: mapping.created_by,
      updated_by: mapping.updated_by,
      profile: mapping.profiles ? {
        id: mapping.profiles.id,
        email: mapping.profiles.email,
        first_name: mapping.profiles.first_name,
        last_name: mapping.profiles.last_name,
        full_name: mapping.profiles.first_name && mapping.profiles.last_name 
          ? `${mapping.profiles.first_name} ${mapping.profiles.last_name}` 
          : mapping.profiles.first_name || mapping.profiles.last_name || 'N/A',
        ehs_id: mapping.profiles.ehs_id,
        role: mapping.profiles.role,
      } : null,
      project: mapping.projects ? {
        id: mapping.projects.id,
        name: mapping.projects.name,
        client_id: mapping.projects.client_id,
        client_sub_id: mapping.projects.client_sub_id,
        project_id: mapping.projects.project_id,
        created_at: mapping.projects.created_at,
        updated_at: mapping.projects.updated_at,
        created_by: mapping.projects.created_by,
        updated_by: mapping.projects.updated_by,
      } : null,
    }));

    return NextResponse.json({
      mappings: transformedMappings,
      total: mappings.length
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
    
    // First, get all existing mappings to count them
    const { data: existingMappings, error: fetchError } = await supabase
      .schema('ehs_pa')
      .from('profiles_projects_mapping')
      .select('id');

    if (fetchError) {
      console.error('Error fetching existing mappings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch existing mappings', details: fetchError.message },
        { status: 500 }
      );
    }

    console.log('Found existing mappings:', existingMappings?.length || 0);

    // Delete all existing mappings by deleting each one individually
    const deletedMappings = [];
    const deleteErrors = [];

    for (const mapping of existingMappings) {
      const { data: deletedMapping, error: deleteError } = await supabase
        .schema('ehs_pa')
        .from('profiles_projects_mapping')
        .delete()
        .eq('id', mapping.id)
        .select('id');

      if (deleteError) {
        console.error(`Error deleting mapping ${mapping.id}:`, deleteError);
        deleteErrors.push({
          id: mapping.id,
          error: deleteError.message
        });
      } else if (deletedMapping && deletedMapping.length > 0) {
        deletedMappings.push(deletedMapping[0]);
        console.log(`Successfully deleted mapping: ${mapping.id}`);
      }
    }

    if (deleteErrors.length > 0) {
      console.error('Some deletions failed:', deleteErrors);
      return NextResponse.json(
        { 
          error: 'Some deletions failed', 
          details: deleteErrors,
          deleted: deletedMappings.length,
          failed: deleteErrors.length
        },
        { status: 500 }
      );
    }

    console.log('Total deleted mappings:', deletedMappings.length);

    return NextResponse.json({
      success: true,
      deleted: deletedMappings.length,
      message: `Successfully deleted ${deletedMappings.length} mappings`
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

    // Test users data from the markdown file
    const testUsersData = [
      // Acme HealthCare users - will be mapped to project 1
      { name: 'Aarav Sharma', email: 'aarav.sharma@acme.com', role: 'manager', domain: 'acme.com', project_id: 1 },
      { name: 'Sanya Kapoor', email: 'sanya.kapoor@acme.com', role: 'assistant_manager', domain: 'acme.com', project_id: 1 },
      { name: 'Rahul Mehta', email: 'rahul.mehta@acme.com', role: 'teamLead', domain: 'acme.com', project_id: 1 },
      { name: 'Priya Patel', email: 'priya.patel@acme.com', role: 'qa', domain: 'acme.com', project_id: 1 },
      { name: 'Vikram Rao', email: 'vikram.rao@acme.com', role: 'qa', domain: 'acme.com', project_id: 1 },
      { name: 'Neha Singh', email: 'neha.singh@acme.com', role: 'user', domain: 'acme.com', project_id: 1 },
      { name: 'Ishaan Verma', email: 'ishaan.verma@acme.com', role: 'user', domain: 'acme.com', project_id: 1 },
      
      // Dollar HealthCare users - will be mapped to project 2
      { name: 'Anjali Desai', email: 'anjali.desai@dollar.care', role: 'manager', domain: 'dollar.care', project_id: 2 },
      { name: 'Karan Gupta', email: 'karan.gupta@dollar.care', role: 'assistant_manager', domain: 'dollar.care', project_id: 2 },
      { name: 'Ritu Nair', email: 'ritu.nair@dollar.care', role: 'teamLead', domain: 'dollar.care', project_id: 2 },
      { name: 'Rohit Iyer', email: 'rohit.iyer@dollar.care', role: 'qa', domain: 'dollar.care', project_id: 2 },
      { name: 'Meera Joshi', email: 'meera.joshi@dollar.care', role: 'qa', domain: 'dollar.care', project_id: 2 },
      { name: 'Sanjay Kulkarni', email: 'sanjay.kulkarni@dollar.care', role: 'user', domain: 'dollar.care', project_id: 2 },
      { name: 'Dia Mahajan', email: 'dia.mahajan@dollar.care', role: 'user', domain: 'dollar.care', project_id: 2 },
    ];

    const defaultValues = {
      created_by: '8a678239-a165-4dab-ad47-c71d4b26c38e',
      updated_by: '8a678239-a165-4dab-ad47-c71d4b26c38e',
    };

    const results = [];
    const errors = [];

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

        // Find the project by project_id
        const { data: project, error: projectError } = await supabase
          .schema('ehs_pa')
          .from('projects')
          .select('id')
          .eq('project_id', testUser.project_id)
          .single();

        if (projectError || !project) {
          errors.push({
            email: testUser.email,
            error: `Project with ID ${testUser.project_id} not found`
          });
          continue;
        }

        // Insert into profiles_projects_mapping table
        const { data: mapping, error: mappingError } = await supabase
          .schema('ehs_pa')
          .from('profiles_projects_mapping')
          .insert({
            profile_id: authUser.id,
            project_id: project.id,
            created_by: defaultValues.created_by,
            updated_by: defaultValues.updated_by,
          })
          .select()
          .single();

        if (mappingError) {
          errors.push({
            email: testUser.email,
            error: `Mapping creation failed: ${mappingError.message}`
          });
        } else {
          results.push({
            email: testUser.email,
            name: testUser.name,
            project_id: testUser.project_id,
            domain: testUser.domain,
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
      message: `Successfully created ${results.length} out of ${testUsersData.length} mappings`
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


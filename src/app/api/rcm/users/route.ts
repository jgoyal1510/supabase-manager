import { NextResponse } from 'next/server';
import { createSupabaseServerAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createSupabaseServerAdminClient();
    
    // Use the admin client to fetch all users from auth.users
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: error.message },
        { status: 500 }
      );
    }

    // Transform the data to include only necessary fields
    const transformedUsers = users.users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
      phone: user.phone,
      phone_confirmed_at: user.phone_confirmed_at,
      is_anonymous: user.is_anonymous,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
      identities: user.identities?.map(identity => ({
        provider: identity.provider,
        created_at: identity.created_at,
        updated_at: identity.updated_at
      }))
    }));

    return NextResponse.json({
      users: transformedUsers,
      total: users.users.length
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, email_confirmed = true } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerAdminClient();

    // Create user with admin client
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: email_confirmed, // This will automatically confirm the email
    });

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: 'Failed to create user', details: error.message },
        { status: 500 }
      );
    }

    // Return the created user data
    return NextResponse.json({
      success: true,
      user: {
        id: user.user.id,
        email: user.user.email,
        created_at: user.user.created_at,
        email_confirmed_at: user.user.email_confirmed_at,
        is_anonymous: user.user.is_anonymous,
      },
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { users } = body;

    // Validate that users array is provided
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'Users array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate each user object
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validationErrors = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (!user.email || !user.password) {
        validationErrors.push(`User ${i + 1}: Email and password are required`);
        continue;
      }
      if (!emailRegex.test(user.email)) {
        validationErrors.push(`User ${i + 1}: Invalid email format`);
      }
      if (user.password.length < 6) {
        validationErrors.push(`User ${i + 1}: Password must be at least 6 characters long`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation errors', details: validationErrors },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerAdminClient();
    const results = [];
    const errors = [];

    // Create users one by one
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      try {
        const { data: createdUser, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: user.email_confirmed !== false, // Default to true if not specified
        });

        if (error) {
          errors.push({
            index: i + 1,
            email: user.email,
            error: error.message
          });
        } else {
          results.push({
            index: i + 1,
            email: user.email,
            id: createdUser.user.id,
            success: true
          });
        }
      } catch (err) {
        errors.push({
          index: i + 1,
          email: user.email,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      failed: errors.length,
      total: users.length,
      results,
      errors,
      message: `Successfully created ${results.length} out of ${users.length} users`
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from './utils/helpers.js';

// Load environment variables
dotenv.config();

// Get Supabase configuration from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables!');
  console.error('Please ensure your backend/.env file contains:');
  console.error('SUPABASE_URL=your_supabase_url');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key');
  process.exit(1);
}

// Create Supabase admin client (bypasses RLS policies)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createAdminUser() {
  console.log('🚀 Creating admin user...\n');

  const adminCredentials = {
    email: 'admin@gmail.com',
    password: '12345678',
    fullName: 'Admin User',
    phone: '+254700000000', // Standard format for Kenyan numbers
    location: 'Nairobi'
  };

  try {
    // Check if admin user already exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', adminCredentials.email)
      .single();

    if (existingUser) {
      console.log('⚠️ Admin user already exists. Updating role to admin...\n');
      
      // Update existing user to admin role
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ role: 'admin' })
        .eq('email', adminCredentials.email);

      if (updateError) {
        console.error('❌ Error updating user role:', updateError.message);
        process.exit(1);
      }

      console.log(`✅ Admin user updated successfully!`);
      console.log(`📧 Email: ${adminCredentials.email}`);
      console.log(`🔒 Password: ${adminCredentials.password}`);
      return;
    }

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('❌ Error checking for existing user:', fetchError.message);
      process.exit(1);
    }

    // Hash the password
    const hashedPassword = await hashPassword(adminCredentials.password);

    // Create the admin user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          full_name: adminCredentials.fullName,
          email: adminCredentials.email,
          password: hashedPassword,
          phone: adminCredentials.phone,
          location: adminCredentials.location,
          role: 'admin',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating admin user:', error.message);
      process.exit(1);
    }

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${adminCredentials.email}`);
    console.log(`🔒 Password: ${adminCredentials.password}`);
    console.log('\n📝 You can now use these credentials to log in to the admin dashboard.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the function
createAdminUser();
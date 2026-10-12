import { type MouseEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth';
import { useLayout } from '@/providers';
import { Alert } from '@/components';
import { BrandWordmark } from '@/components/app/BrandLogo';

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Wrong email format')
    .min(3, 'Minimum 3 symbols')
    .max(50, 'Maximum 50 symbols')
    .required('Email is required'),
  password: Yup.string()
    .min(3, 'Minimum 3 symbols')
    .max(50, 'Maximum 50 symbols')
    .required('Password is required'),
  remember: Yup.boolean()
});

const initialValues = {
  email: '',
  password: '',
  remember: false
};

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [showPassword, setShowPassword] = useState(false);
  const { currentLayout } = useLayout();

  const formik = useFormik({
    initialValues,
    validationSchema: loginSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true);

      try {
        if (!login) {
          throw new Error('JWTProvider is required for this form.');
        }

        await login(values.email, values.password);

        if (values.remember) {
          localStorage.setItem('email', values.email);
        } else {
          localStorage.removeItem('email');
        }

        navigate(from, { replace: true });
      } catch {
        setStatus('The login details are incorrect');
        setSubmitting(false);
      }
      setLoading(false);
    }
  });

  const togglePassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setShowPassword(!showPassword);
  };

  const signupPath = currentLayout?.name === 'auth-branded' ? '/auth/signup' : '/auth/classic/signup';
  const resetPath =
    currentLayout?.name === 'auth-branded' ? '/auth/reset-password' : '/auth/classic/reset-password';

  return (
    <div className="w-full max-w-[420px]">
      <form className="flex flex-col gap-5" onSubmit={formik.handleSubmit} noValidate>
        <BrandWordmark width={210} className="hidden lg:block mb-2 -ms-1" />
        <div className="flex flex-col gap-2 mb-2">
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight">Welcome back</h1>
          <p className="text-sm text-gray-600">Sign in to manage your inventory, readers and assets.</p>
        </div>

        {formik.status && <Alert variant="danger">{formik.status}</Alert>}

        <div className="flex flex-col gap-1.5">
          <label className="text-2sm font-medium text-gray-900" htmlFor="login-email">
            Email address
          </label>
          <label
            className={clsx('input h-11 bg-light', {
              '!border-danger': formik.touched.email && formik.errors.email
            })}
          >
            <KeenIcon icon="sms" className="text-gray-500" />
            <input
              id="login-email"
              type="email"
              placeholder="name@company.com"
              autoComplete="username"
              {...formik.getFieldProps('email')}
            />
          </label>
          {formik.touched.email && formik.errors.email && (
            <span role="alert" className="text-danger text-xs">
              {formik.errors.email}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1">
            <label className="text-2sm font-medium text-gray-900" htmlFor="login-password">
              Password
            </label>
            <Link to={resetPath} className="text-2sm link shrink-0">
              Forgot password?
            </Link>
          </div>
          <label
            className={clsx('input h-11 bg-light', {
              '!border-danger': formik.touched.password && formik.errors.password
            })}
          >
            <KeenIcon icon="lock" className="text-gray-500" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              {...formik.getFieldProps('password')}
            />
            <button
              type="button"
              className="btn btn-icon"
              onClick={togglePassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <KeenIcon icon={showPassword ? 'eye-slash' : 'eye'} className="text-gray-500" />
            </button>
          </label>
          {formik.touched.password && formik.errors.password && (
            <span role="alert" className="text-danger text-xs">
              {formik.errors.password}
            </span>
          )}
        </div>

        <label className="checkbox-group">
          <input
            className="checkbox checkbox-sm"
            type="checkbox"
            {...formik.getFieldProps('remember')}
          />
          <span className="checkbox-label text-2sm text-gray-700">Keep me signed in</span>
        </label>

        <button
          type="submit"
          className="btn btn-primary h-11 flex justify-center w-full"
          disabled={loading || formik.isSubmitting}
        >
          {loading ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Signing in…
            </>
          ) : (
            <>
              Sign in <KeenIcon icon="arrow-right" />
            </>
          )}
        </button>

        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-light px-4 py-3 text-xs text-gray-600">
          <KeenIcon icon="shield-tick" className="text-lg text-success shrink-0" />
          <span>
            Access is limited to authorised staff. New user?{' '}
            <Link to={signupPath} className="link font-medium">
              Request an account
            </Link>
          </span>
        </div>
      </form>
    </div>
  );
};

export { Login };

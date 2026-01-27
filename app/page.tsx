export default function Home() {
 
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome</h1>
        <p className="text-lg mb-6">Please sign in to continue</p>
        <a href="/sign-in" className="btn btn-primary">
          Sign In
        </a>
      </div>
    </div>
  );
}

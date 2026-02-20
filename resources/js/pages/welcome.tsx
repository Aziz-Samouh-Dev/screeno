import React from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import Navbar from './welcome/Navbar';
import Hero from './welcome/Hero';
import { login } from '@/routes';
import Features from './welcome/Features';
import HowItWorks from './welcome/HowItWorks';
import Benefits from './welcome/Benefits';
import CTA from './welcome/CTA';
import Footer from './welcome/Footer';

export default function Welcome({ canRegister = true }: { canRegister?: boolean }) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome" />

            <div className="min-h-screen flex flex-col">
                <Navbar auth={auth} canRegister={canRegister} />
                
                <main>
                    <Hero
                        onGetStarted={() => {
                            if (!auth.user) {
                                router.visit(login());
                            } else {
                                router.visit('/dashboard');
                            }
                        }}
                    />
                    <Features />
                    <HowItWorks />
                    <Benefits />
                    <CTA
                        onGetStarted={() => {
                            if (!auth.user) {
                                router.visit(login());
                            } else {
                                router.visit('/dashboard');
                            }
                        }}
                    />
                </main>

                <Footer />
            </div>
        </>
    );
}

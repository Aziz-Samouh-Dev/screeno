import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
              <span className="text-white dark:text-black font-bold text-lg">S</span>
            </div>
        </div>
    );
}

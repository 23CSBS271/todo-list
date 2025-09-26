import React from "react";

const AvatarGroup =({avatars, maxVisible = 3}) => {
    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
    };

    return (
        <div className="flex items-center -space-x-2">
            {avatars.slice(0, maxVisible).map((avatar, index) => (
                avatar.image ? (
                    <img
                        key={index}
                        src={avatar.image}
                        alt={`Avatar ${index}`}
                        className="w-9 h-9 rounded-full border-2 border-white"
                    />
                ) : (
                    <div
                        key={index}
                        className="w-9 h-9 flex items-center justify-center bg-gray-300 text-gray-800 text-sm font-medium rounded-full border-2 border-white"
                    >
                        {getInitials(avatar.name)}
                    </div>
                )
            ))}
            {avatars.length > maxVisible && (
                <div className="w-9 h-9 flex items-center justify-center bg-blue-50 text-sm font-medium rounded-full border-2 border-white">
                    +{avatars.length - maxVisible}
                </div>
            )}
        </div>
    )
}

export default AvatarGroup
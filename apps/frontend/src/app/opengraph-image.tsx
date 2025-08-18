import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const contentType = "image/png";

export const size = {
	width: 1200,
	height: 630,
};

export default async function Image() {
	return new ImageResponse(
		<div
			style={{
				display: "flex",
				height: "100%",
				width: "100%",
				alignItems: "center",
				justifyContent: "center",
				flexDirection: "column",
				backgroundColor: "hsl(240 10% 3.9%)",
				color: "hsl(0 0% 98%)",
				fontSize: 60,
				letterSpacing: -2,
				fontWeight: 700,
				textAlign: "center",
				padding: "40px",
				backgroundImage:
					"radial-gradient(circle at 25% 25%, hsl(240 15% 8%) 0%, hsl(240 10% 3.9%) 100%)",
				position: "relative",
				overflow: "hidden",
			}}
		>
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: "8px",
					background: "#c1644d",
				}}
			/>
			<div
				style={{
					fontSize: 80,
					background: "linear-gradient(to right, #e07a5f, #c1644d)",
					backgroundClip: "text",
					color: "transparent",
					marginBottom: "20px",
				}}
			>
				Ultimate TicTacToe
			</div>
			<div
				style={{ fontSize: 36, color: "hsl(0 0% 80%)", marginBottom: "40px" }}
			>
				Play anywhere, anytime
			</div>
			<div
				style={{
					display: "flex",
					gap: "20px",
				}}
			>
				<div
					style={{
						background: "#c1644d",
						color: "white",
						padding: "16px 32px",
						borderRadius: "8px",
						fontSize: 38,
						boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)",
					}}
				>
					Play Online
				</div>
				<div
					style={{
						border: "2px solid #c1644d",
						color: "white",
						padding: "16px 32px",
						borderRadius: "8px",
						fontSize: 38,
						boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)",
					}}
				>
					Local Mode
				</div>
			</div>
		</div>,
	);
}

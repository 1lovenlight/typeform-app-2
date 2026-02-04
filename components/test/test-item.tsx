import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";

type Education = {
  school: string;
  degree: string;
  field: string;
};

const educationData: Education[] = [
  {
    school: "University of Connecticut",
    degree: "BA",
    field: "Psychology",
  },
];

export default function EducationItem() {
  return (
    <>
      {educationData.map((edu, index) => (
        <Item key={index}>
          <ItemContent>
            <ItemTitle>{edu.school}</ItemTitle>
            <ItemDescription>
              {edu.degree} in {edu.field}
            </ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </>
  );
}
